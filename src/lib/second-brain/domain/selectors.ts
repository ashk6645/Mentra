import { TIME_OF_DAY_ORDER } from './types'
import type {
    DayKey, Habit, HabitEntry, Goal, Milestone, Routine, RoutineStep,
    RoutineStepEntry, SecondBrainData,
} from './types'
import { toDateKey, fromDateKey, todayKey, weekDays, weekdayOf } from '../date'

/**
 * Derived figures.
 *
 * Every function here is pure over its inputs — no storage, no clock beyond an
 * injectable `today`. That is what makes them testable, and it keeps the maths
 * out of JSX where the same calculation would drift across three components.
 */

// ─── Habit scheduling ────────────────────────────────────────────────────────

/**
 * Is this habit expected on this specific day?
 *
 * `weekly_count` deliberately returns false: "gym 3× a week" commits you to no
 * particular day, so no single day can be a miss. Progress for those habits is
 * measured per week — see `weeklyTarget`.
 */
export function isScheduledOn(habit: Habit, date: DayKey): boolean {
    switch (habit.frequency.kind) {
        case 'daily':
            return true
        case 'weekdays':
            return habit.frequency.days.includes(weekdayOf(date))
        case 'weekly_count':
            return false
    }
}

/** True when the habit is measured weekly rather than per day. */
export const isWeeklyCount = (habit: Habit): boolean => habit.frequency.kind === 'weekly_count'

/** Times per week expected, or null for per-day habits. */
export function weeklyTarget(habit: Habit): number | null {
    return habit.frequency.kind === 'weekly_count' ? habit.frequency.timesPerWeek : null
}

/**
 * Can this habit be ticked on this day?
 *
 * Every day for a weekly-count habit — none is required, any may count. For the
 * rest, only the days it is scheduled.
 */
export const isLoggableOn = (habit: Habit, date: DayKey): boolean =>
    isWeeklyCount(habit) || isScheduledOn(habit, date)

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "Every day", "Weekdays", "3× a week", "Mon, Wed, Fri". */
export function frequencyLabel(habit: Pick<Habit, 'frequency'>): string {
    const f = habit.frequency
    if (f.kind === 'daily') return 'Every day'
    if (f.kind === 'weekly_count') return `${f.timesPerWeek}× a week`
    return daysLabel(f.days)
}

/** A weekday set in words. Empty means every day. */
export function daysLabel(days: number[]): string {
    if (days.length === 0 || days.length === 7) return 'Every day'

    const sorted = [...days].sort((a, b) => a - b)
    if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Weekdays'
    if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return 'Weekends'

    // Monday-first, to match every calendar in the feature.
    return [...sorted.filter(d => d !== 0), ...sorted.filter(d => d === 0)]
        .map(d => DAY_SHORT[d])
        .join(', ')
}

/** Through the day — morning first — then in the order they were added. */
export function sortByTimeOfDay<T extends Habit | Routine>(items: T[]): T[] {
    return [...items].sort(
        (a, b) =>
            TIME_OF_DAY_ORDER.indexOf(a.timeOfDay) - TIME_OF_DAY_ORDER.indexOf(b.timeOfDay) ||
            a.sortOrder - b.sortOrder
    )
}

// ─── Habit completion ────────────────────────────────────────────────────────

/** Index entries once; every other selector reads through this. */
export function buildEntryIndex(entries: HabitEntry[]): Set<string> {
    const index = new Set<string>()
    for (const entry of entries) index.add(`${entry.habitId}:${entry.date}`)
    return index
}

export type DoneLookup = (habitId: string, date: DayKey) => boolean

export const lookupFrom = (index: Set<string>): DoneLookup =>
    (habitId, date) => index.has(`${habitId}:${date}`)

export interface Completion {
    done: number
    /** Expected occurrences in range, excluding the future. */
    expected: number
    percent: number
}

const pct = (done: number, expected: number) =>
    expected === 0 ? 0 : Math.round((done / expected) * 100)

/**
 * The first day a habit is measured from — the day it was created.
 *
 * Before this, a day is not a miss; the habit didn't exist yet. Without it, a
 * habit added today opens its first month at 0%, which is the fastest way to make
 * someone regret starting. (Backfilling an earlier day moves `createdAt` back —
 * see `toggleHabit` — so a logged day is never "before" its own habit.)
 */
export function trackingStart(habit: Habit): DayKey {
    return /^\d{4}-\d{2}-\d{2}/.test(habit.createdAt) ? toDateKey(new Date(habit.createdAt)) : ''
}

/**
 * Completion for one habit across a range of days.
 *
 * Excluded from the denominator: future days — counting Thursday as a miss on
 * Monday would drag every figure down — and days before the habit existed.
 */
export function habitCompletion(
    habit: Habit,
    isDone: DoneLookup,
    days: DayKey[],
    today: DayKey = todayKey()
): Completion {
    const start = trackingStart(habit)
    const past = days.filter(day => day <= today && day >= start)

    if (isWeeklyCount(habit)) {
        // Expectation is per week, prorated across however many days are visible.
        const target = weeklyTarget(habit)!
        const done = past.filter(day => isDone(habit.id, day)).length
        const expected = past.length === 0 ? 0 : Math.max(1, Math.round((target * past.length) / 7))
        return { done, expected, percent: Math.min(100, pct(done, expected)) }
    }

    const scheduled = past.filter(day => isScheduledOn(habit, day))
    const done = scheduled.filter(day => isDone(habit.id, day)).length

    return { done, expected: scheduled.length, percent: pct(done, scheduled.length) }
}

/** How far back a streak search will walk. A year is well past useful. */
const MAX_LOOKBACK_DAYS = 366

/**
 * Current streak.
 *
 * - Per-day habits: consecutive *scheduled* days completed. A weekday habit does
 *   not lose its streak over the weekend.
 * - Weekly-count habits: consecutive weeks that hit the target.
 *
 * Today — and the current week — are forgiven while still open, so a streak
 * doesn't read as broken at 9am simply because the day isn't over.
 */
export function habitStreak(
    habit: Habit,
    isDone: DoneLookup,
    today: DayKey = todayKey()
): number {
    return isWeeklyCount(habit)
        ? weeklyStreak(habit, isDone, today)
        : dailyStreak(habit, isDone, today)
}

function dailyStreak(habit: Habit, isDone: DoneLookup, today: DayKey): number {
    let streak = 0
    const cursor = fromDateKey(today)

    for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
        const day = toDateKey(cursor)

        if (isScheduledOn(habit, day)) {
            if (isDone(habit.id, day)) streak++
            else if (day !== today) break
        }

        cursor.setDate(cursor.getDate() - 1)
    }

    return streak
}

function weeklyStreak(habit: Habit, isDone: DoneLookup, today: DayKey): number {
    const target = weeklyTarget(habit)!
    let streak = 0
    const cursor = fromDateKey(today)

    for (let week = 0; week < 53; week++) {
        const days = weekDays(cursor)
        const hits = days.filter(day => day <= today && isDone(habit.id, day)).length

        if (hits >= target) streak++
        else if (!days.includes(today)) break

        cursor.setDate(cursor.getDate() - 7)
    }

    return streak
}

/** Sessions logged in the week containing `today`, for weekly-count habits. */
export function weekHits(habit: Habit, isDone: DoneLookup, today: DayKey = todayKey()): number {
    return weekDays(fromDateKey(today)).filter(day => day <= today && isDone(habit.id, day)).length
}

/**
 * Does this habit belong on today's list?
 *
 * Scheduled habits, obviously. Weekly-count habits too, until the week's target
 * is met — or if they were already ticked today, so ticking one doesn't make it
 * vanish from under the cursor.
 */
export function isDueToday(habit: Habit, isDone: DoneLookup, today: DayKey = todayKey()): boolean {
    if (isScheduledOn(habit, today)) return true
    if (!isWeeklyCount(habit)) return false
    return isDone(habit.id, today) || weekHits(habit, isDone, today) < weeklyTarget(habit)!
}

/** Completion across every habit for one day. */
export function dayCompletion(habits: Habit[], isDone: DoneLookup, date: DayKey): Completion {
    const due = habits.filter(habit => isScheduledOn(habit, date))
    const done = due.filter(habit => isDone(habit.id, date)).length

    // A weekly-count habit counts toward the day it was actually done, so a gym
    // session on an unscheduled day isn't invisible.
    const bonus = habits.filter(habit => isWeeklyCount(habit) && isDone(habit.id, date)).length

    return {
        done: done + bonus,
        expected: due.length + bonus,
        percent: pct(done + bonus, due.length + bonus),
    }
}

// ─── Routines ────────────────────────────────────────────────────────────────

export function isRoutineScheduledOn(routine: Routine, date: DayKey): boolean {
    return routine.days.length === 0 || routine.days.includes(weekdayOf(date))
}

export function routineProgress(
    steps: RoutineStep[],
    entries: RoutineStepEntry[],
    date: DayKey
): Completion {
    const doneIds = new Set(entries.filter(entry => entry.date === date).map(entry => entry.stepId))
    const done = steps.filter(step => doneIds.has(step.id)).length

    return { done, expected: steps.length, percent: pct(done, steps.length) }
}

/** Total estimated minutes, ignoring steps with no estimate. */
export const routineMinutes = (steps: RoutineStep[]): number =>
    steps.reduce((total, step) => total + (step.estimatedMinutes ?? 0), 0)

// ─── Goals ───────────────────────────────────────────────────────────────────

/**
 * Goal progress, 0-100.
 *
 * Achieved is 100 whatever the numbers say. Otherwise number-measured goals
 * measure against the target and the rest fall back to milestone completion, so
 * a goal is never a decorative bar with no source of truth.
 */
export function goalProgress(goal: Goal, milestones: Milestone[]): number {
    if (goal.status === 'achieved') return 100

    if (goal.target !== null && goal.target > 0) {
        return Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100)))
    }

    const own = milestones.filter(m => m.goalId === goal.id)
    if (own.length === 0) return 0

    return Math.round((own.filter(m => m.completedAt !== null).length / own.length) * 100)
}

export interface GoalPace {
    progress: number
    /** Share of the goal's window already gone, 0-100. */
    elapsed: number
    /** Whole days until the target date. Negative once it has passed. */
    daysLeft: number
    behind: boolean
}

/**
 * Is the goal behind where it should be?
 *
 * Compares progress against elapsed time. A goal 20% done with 80% of its window
 * gone is behind regardless of how it feels. Only active goals can be behind —
 * a paused goal is not slipping, it is parked.
 */
export function goalPace(goal: Goal, milestones: Milestone[], today: DayKey = todayKey()): GoalPace {
    const progress = goalProgress(goal, milestones)

    const start = fromDateKey(goal.startDate).getTime()
    const end = fromDateKey(goal.targetDate).getTime()
    const now = fromDateKey(today).getTime()

    const span = end - start
    const elapsed = span <= 0 ? 100 : Math.min(100, Math.max(0, Math.round(((now - start) / span) * 100)))
    const daysLeft = Math.round((end - now) / 86_400_000)

    // A ten-point grace, so a goal isn't flagged the moment it slips a day.
    const behind = goal.status === 'active' && elapsed - progress > 10

    return { progress, elapsed, daysLeft, behind }
}

// ─── Daily score ─────────────────────────────────────────────────────────────

export interface ScoreComponent {
    label: string
    done: number
    total: number
    /** Share of the final score. Weights across all components sum to 1. */
    weight: number
}

export interface DailyScore {
    /** 0-100. */
    value: number
    components: ScoreComponent[]
}

/**
 * A single number for the day, and the arithmetic behind it.
 *
 * Components with nothing scheduled are dropped and the rest renormalised, so a
 * day with no routine can still reach 100. The parts are returned alongside the
 * total so the UI can always show its working.
 */
export function dailyScore(
    data: Pick<SecondBrainData, 'habits' | 'habitEntries' | 'routines' | 'routineSteps' | 'routineStepEntries'>,
    date: DayKey
): DailyScore {
    const isDone = lookupFrom(buildEntryIndex(data.habitEntries))
    const habits = dayCompletion(data.habits, isDone, date)

    const scheduled = new Set(
        data.routines.filter(r => isRoutineScheduledOn(r, date)).map(r => r.id)
    )
    const routines = routineProgress(
        data.routineSteps.filter(step => scheduled.has(step.routineId)),
        data.routineStepEntries,
        date
    )

    const components = ([
        { label: 'Habits', done: habits.done, total: habits.expected, weight: 0.6 },
        { label: 'Routines', done: routines.done, total: routines.expected, weight: 0.4 },
    ] satisfies ScoreComponent[]).filter(component => component.total > 0)

    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight === 0) return { value: 0, components: [] }

    const value = Math.round(
        components.reduce((sum, c) => sum + (c.done / c.total) * (c.weight / totalWeight), 0) * 100
    )

    return { value: Math.min(100, value), components }
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchHit {
    id: string
    title: string
    /** Human label for the kind of thing, e.g. "Habit". */
    kind: string
    /** Where to send the user. */
    href: string
}

/**
 * Search across everything this store owns, for the ⌘K palette.
 *
 * Prefix matches rank above substring matches, because typing "gy" should
 * surface "Gym" before "Biology" no matter which was created first.
 */
export function searchSecondBrain(
    data: Pick<SecondBrainData, 'habits' | 'routines' | 'goals'>,
    query: string,
    limit = 8
): SearchHit[] {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []

    const hits: { hit: SearchHit; rank: number }[] = []

    const consider = (title: string, kind: string, href: string, id: string) => {
        const index = title.toLowerCase().indexOf(needle)
        if (index === -1) return
        hits.push({ hit: { id, title, kind, href }, rank: index === 0 ? 0 : 1 })
    }

    for (const h of data.habits) consider(h.name, 'Habit', '/second-brain/habits', h.id)
    for (const r of data.routines) consider(r.name, 'Routine', '/second-brain/routines', r.id)
    for (const g of data.goals) consider(g.title, 'Goal', `/second-brain/goals?goal=${g.id}`, g.id)

    return hits
        .sort((a, b) => a.rank - b.rank || a.hit.title.localeCompare(b.hit.title))
        .slice(0, limit)
        .map(entry => entry.hit)
}
