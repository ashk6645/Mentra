/**
 * Second Brain — data shapes.
 *
 * These deliberately mirror the Prisma models this feature would use if it graduates
 * from a demo. Components take them as props and never reach for storage themselves,
 * so replacing the localStorage layer with server actions touches one module rather
 * than every screen.
 */

/** Rough part of the day a routine item belongs to. Ordered for display. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening']

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
}

/**
 * A repeating routine item — gym, study, reading.
 *
 * `scheduleDays` uses JS weekday numbering (0 = Sunday ... 6 = Saturday) to match
 * the existing `Task.recurrenceDays` convention, so the two stay comparable.
 */
export interface Habit {
    id: string
    name: string
    icon: string
    /** Weekdays this habit is expected on. Empty means every day. */
    scheduleDays: number[]
    timeOfDay: TimeOfDay
    createdAt: string
}

/**
 * One habit, one calendar day.
 *
 * `date` is a plain `YYYY-MM-DD` string, never a timestamp. "Did I go to the gym on
 * Thursday" is a calendar question — storing an instant makes a late-evening check-in
 * land on the wrong day as soon as the timezone shifts.
 */
export interface HabitEntry {
    habitId: string
    date: string
    completed: boolean
}

/** A one-off item that belongs to a single day, distinct from the app's real Tasks. */
export interface DayTask {
    id: string
    title: string
    /** `YYYY-MM-DD` — same reasoning as HabitEntry.date. */
    date: string
    timeOfDay: TimeOfDay
    completed: boolean
    createdAt: string
}

/** Everything the feature persists. One object, one storage key. */
export interface SecondBrainState {
    habits: Habit[]
    entries: HabitEntry[]
    tasks: DayTask[]
}

/** Stable key for an entry lookup. */
export const entryKey = (habitId: string, date: string) => `${habitId}:${date}`
