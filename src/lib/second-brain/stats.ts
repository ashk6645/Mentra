import type { Habit } from './types'
import { fromDateKey, toDateKey, todayKey, weekdayOf } from './date'

/**
 * Derived metrics for Second Brain.
 *
 * All pure functions over (habit, isDone) so they can be reused by any view and
 * later run server-side unchanged.
 */

/** Is this habit expected on this day? Empty scheduleDays means every day. */
export function isScheduled(habit: Habit, date: string): boolean {
    return habit.scheduleDays.length === 0 || habit.scheduleDays.includes(weekdayOf(date))
}

/** How many days back a streak may search. One year is well past useful. */
const MAX_STREAK_LOOKBACK = 366

type IsDone = (habitId: string, date: string) => boolean

/**
 * Consecutive scheduled days completed, counting backwards from today.
 *
 * Only *scheduled* days count — a gym habit set to weekdays doesn't lose its streak
 * over the weekend. Today is forgiven while still incomplete: a streak shouldn't
 * read as broken at 9am simply because the day isn't over.
 */
export function currentStreak(habit: Habit, isDone: IsDone, from: string = todayKey()): number {
    let streak = 0
    const cursor = fromDateKey(from)
    const today = todayKey()

    for (let i = 0; i < MAX_STREAK_LOOKBACK; i++) {
        const key = toDateKey(cursor)

        if (isScheduled(habit, key)) {
            if (isDone(habit.id, key)) {
                streak++
            } else if (key !== today) {
                break
            }
            // else: today, not done yet — skip without breaking.
        }

        cursor.setDate(cursor.getDate() - 1)
    }

    return streak
}

/** Longest run of consecutive scheduled days completed within the given range. */
export function bestStreak(habit: Habit, isDone: IsDone, days: string[]): number {
    let best = 0
    let run = 0

    for (const day of days) {
        if (!isScheduled(habit, day)) continue

        if (isDone(habit.id, day)) {
            run++
            if (run > best) best = run
        } else {
            run = 0
        }
    }

    return best
}

export interface Completion {
    done: number
    /** Scheduled days in range, excluding the future — a day not yet reached isn't a miss. */
    scheduled: number
    /** 0-100, rounded. Zero when nothing was scheduled. */
    percent: number
}

/** Completion rate for one habit across a range of days. */
export function completionFor(habit: Habit, isDone: IsDone, days: string[]): Completion {
    const today = todayKey()
    let done = 0
    let scheduled = 0

    for (const day of days) {
        if (!isScheduled(habit, day)) continue

        // Counting future days as misses would drag every percentage down
        // mid-week for no reason.
        if (day > today) continue

        scheduled++
        if (isDone(habit.id, day)) done++
    }

    return {
        done,
        scheduled,
        percent: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
    }
}

/** Completion across every habit for a single day — the per-row progress. */
export function dayCompletion(habits: Habit[], isDone: IsDone, date: string): Completion {
    let done = 0
    let scheduled = 0

    for (const habit of habits) {
        if (!isScheduled(habit, date)) continue
        scheduled++
        if (isDone(habit.id, date)) done++
    }

    return {
        done,
        scheduled,
        percent: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
    }
}

/** Every day key in the month containing `date`. */
export function monthDays(date: Date): string[] {
    const year = date.getFullYear()
    const month = date.getMonth()
    const count = new Date(year, month + 1, 0).getDate()

    return Array.from({ length: count }, (_, i) => toDateKey(new Date(year, month, i + 1)))
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

export const monthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
