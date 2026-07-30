import { addDays, addMonths, addWeeks, addYears, getDaysInMonth, startOfDay, setDate } from 'date-fns'

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceRule {
    interval: RecurrenceInterval
    /** How many intervals to advance per occurrence. Values below 1 are treated as 1. */
    step?: number | null
    /**
     * For daily/weekly: weekdays the task repeats on (0 = Sunday ... 6 = Saturday).
     * For monthly: a single day of the month (1-31; 31 means "last day").
     */
    days?: number[] | null
    /** Stop recurring after this date. */
    end?: Date | null
}

/**
 * Upper bound on catch-up iterations.
 *
 * A task left uncompleted for years must not spin the event loop while walking
 * forward one step at a time, and a malformed rule must not loop forever. 520 is
 * ten years of weekly steps — comfortably past any real backlog.
 */
const MAX_ADVANCE_ITERATIONS = 520

/** Clamp a day-of-month to the target month, so 31 lands on the 28th in February. */
function setDayOfMonthClamped(date: Date, dayOfMonth: number): Date {
    return setDate(date, Math.min(dayOfMonth, getDaysInMonth(date)))
}

/**
 * Next date strictly after `from` whose weekday is in `days`.
 * Time of day is carried over from `from`. Returns null if `days` has no valid entry.
 */
function nextMatchingWeekday(from: Date, days: number[]): Date | null {
    const wanted = new Set(days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))
    if (wanted.size === 0) return null

    // A full week always contains every weekday, so this terminates in <= 7 steps.
    for (let offset = 1; offset <= 7; offset++) {
        const candidate = addDays(from, offset)
        if (wanted.has(candidate.getDay())) return candidate
    }

    return null
}

/** Advance exactly one occurrence past `from`. Always returns a date strictly after `from`. */
function advanceOnce(from: Date, rule: RecurrenceRule): Date {
    const step = Math.max(1, Math.trunc(rule.step ?? 1))
    const days = rule.days ?? []

    switch (rule.interval) {
        case 'daily':
            // "Every weekday" is stored as daily + a weekday list.
            if (days.length > 0) {
                return nextMatchingWeekday(from, days) ?? addDays(from, step)
            }
            return addDays(from, step)

        case 'weekly':
            // With specific weekdays the next hit is within the week, so the step
            // applies to the weekday walk rather than to whole weeks.
            if (days.length > 0) {
                return nextMatchingWeekday(from, days) ?? addWeeks(from, step)
            }
            return addWeeks(from, step)

        case 'monthly': {
            // A stored day-of-month ("1st of month") has to be honoured; plain
            // addMonths keeps whatever day the task happened to be due on and
            // silently drifts off the requested date.
            const target = days[0]
            if (Number.isInteger(target) && target >= 1 && target <= 31) {
                // Normalise to the 1st *before* adding months, so a due date late in
                // a long month cannot overflow into the wrong target month. setDate
                // is used rather than startOfMonth because it preserves the time of
                // day — the task should stay due at 09:00, not slide to midnight.
                return setDayOfMonthClamped(addMonths(setDate(from, 1), step), target)
            }
            return addMonths(from, step)
        }

        case 'yearly':
            return addYears(from, step)
    }
}

/**
 * Compute the next due date for a recurring task.
 *
 * Skips forward past occurrences instead of emitting one. Completing a daily task
 * after a two-week break should schedule it for today, not resurrect a date that
 * is already overdue — otherwise every completion regenerates a task the user is
 * immediately behind on.
 *
 * @param from Due date of the occurrence just completed.
 * @param now  Reference "today"; injectable so the behaviour is testable.
 * @returns The next due date, or null if the rule is exhausted or malformed.
 */
export function getNextOccurrence(
    from: Date,
    rule: RecurrenceRule,
    now: Date = new Date()
): Date | null {
    if (!from || Number.isNaN(from.getTime())) return null

    const notBefore = startOfDay(now).getTime()

    let candidate = advanceOnce(from, rule)
    let iterations = 1

    while (candidate.getTime() < notBefore && iterations < MAX_ADVANCE_ITERATIONS) {
        const next = advanceOnce(candidate, rule)

        // Defensive: a rule that fails to move forward would loop until the cap.
        if (next.getTime() <= candidate.getTime()) break

        candidate = next
        iterations++
    }

    if (rule.end && candidate.getTime() > rule.end.getTime()) return null

    return candidate
}

/** Ordinal suffix for a day of the month. 11-13 are the exceptions to the digit rule. */
function ordinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th'

    switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
    }
}

/** Plural unit label for an interval, e.g. 3 + 'daily' -> "3 days". */
const INTERVAL_TO_UNIT: Record<RecurrenceInterval, string> = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
    yearly: 'year',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Format recurrence pattern into human-readable text
 */
export function formatRecurrence(
    interval?: RecurrenceInterval | null,
    step?: number | null,
    days?: number[] | null
): string {
    if (!interval) return 'Recurring'

    const actualStep = Math.max(1, Math.trunc(step || 1))

    // Handle weekdays pattern
    if (days && days.length === 5 &&
        days.includes(1) && days.includes(2) && days.includes(3) &&
        days.includes(4) && days.includes(5)) {
        return 'Every weekday'
    }

    // Handle specific day of week
    if (interval === 'weekly' && days && days.length === 1) {
        const name = DAY_NAMES[days[0]]
        if (name) return `Every ${name}`
    }

    // Handle day of month
    if (interval === 'monthly' && days && days.length === 1) {
        const day = days[0]
        if (day >= 1 && day <= 31) {
            return `${day}${ordinalSuffix(day)} of month`
        }
    }

    // Standard intervals with step
    if (actualStep === 1) {
        switch (interval) {
            case 'daily': return 'Daily'
            case 'weekly': return 'Weekly'
            case 'monthly': return 'Monthly'
            case 'yearly': return 'Yearly'
        }
    }

    // Custom step. Must be a lookup: stripping "ly" turns "daily" into "dai".
    return `Every ${actualStep} ${INTERVAL_TO_UNIT[interval]}s`
}
