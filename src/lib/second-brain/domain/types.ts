/**
 * Second Brain domain models.
 *
 * Deliberately small. Second Brain covers three things Mentra does not already
 * own — habits, routines and goals — and links to the ones it does (tasks and
 * projects live in Postgres and are read, never duplicated here).
 *
 * These are written as the shapes a Prisma schema would take, so the eventual
 * migration is a transcription rather than a redesign. Ids are strings, dates that
 * represent a calendar day are `YYYY-MM-DD` strings, and dates that represent an
 * instant are ISO strings.
 */

// ─── Shared ──────────────────────────────────────────────────────────────────

/** A calendar day, `YYYY-MM-DD`. Never a timestamp — see lib/second-brain/date.ts. */
export type DayKey = string

/** An instant, ISO 8601. */
export type Timestamp = string

export interface Entity {
    id: string
    createdAt: Timestamp
    updatedAt: Timestamp
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening']

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
}

// ─── Habits ──────────────────────────────────────────────────────────────────

/**
 * How often a habit is expected.
 *
 * `weekly_count` is the one people actually want and most trackers omit: "gym 3×
 * a week, any days". Without it, going Tuesday instead of Monday reads as a miss.
 */
export type HabitFrequency =
    | { kind: 'daily' }
    /** JS weekday numbers, 0 = Sunday. Matches Task.recurrenceDays. */
    | { kind: 'weekdays'; days: number[] }
    | { kind: 'weekly_count'; timesPerWeek: number }

export interface Habit extends Entity {
    name: string
    /** Icon id from lib/second-brain/icons. */
    icon: string
    frequency: HabitFrequency
    timeOfDay: TimeOfDay
    sortOrder: number
}

/**
 * One habit, done on one calendar day.
 *
 * A row exists only when the habit was done — absence means "not done", so
 * storage never grows a row per habit per day merely because someone looked.
 */
export interface HabitEntry {
    habitId: string
    date: DayKey
}

// ─── Routines ────────────────────────────────────────────────────────────────

/** An ordered sequence, distinct from a habit: the order is the point. */
export interface Routine extends Entity {
    name: string
    icon: string
    timeOfDay: TimeOfDay
    /** Which weekdays it runs. Empty = every day. */
    days: number[]
    sortOrder: number
}

export interface RoutineStep extends Entity {
    routineId: string
    title: string
    /** Rough minutes, used to show a total for the routine. */
    estimatedMinutes: number | null
    sortOrder: number
}

/** Per-day completion of a single step. */
export interface RoutineStepEntry {
    stepId: string
    date: DayKey
    completedAt: Timestamp
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export type GoalStatus = 'active' | 'paused' | 'achieved'

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    achieved: 'Achieved',
}

/**
 * An outcome, not an activity.
 *
 * `metric`/`target`/`current` exist so progress is measured rather than guessed.
 * When `target` is null the goal is measured by its milestones instead.
 * Whether it is *behind* is derived from pace, never set by hand.
 */
export interface Goal extends Entity {
    title: string
    /** The reason it matters. */
    why: string
    status: GoalStatus
    startDate: DayKey
    targetDate: DayKey
    /** e.g. "books", "kg". Null for milestone-measured goals. */
    metric: string | null
    target: number | null
    current: number
    sortOrder: number
}

export interface Milestone extends Entity {
    goalId: string
    title: string
    completedAt: Timestamp | null
    sortOrder: number
}

// ─── The whole store ─────────────────────────────────────────────────────────

/** Every collection the repository persists. One shape, one version. */
export interface SecondBrainData {
    habits: Habit[]
    habitEntries: HabitEntry[]
    routines: Routine[]
    routineSteps: RoutineStep[]
    routineStepEntries: RoutineStepEntry[]
    goals: Goal[]
    milestones: Milestone[]
}

export type CollectionName = keyof SecondBrainData

/** Empty store — the shape every reader can rely on existing. */
export function emptyData(): SecondBrainData {
    return {
        habits: [], habitEntries: [],
        routines: [], routineSteps: [], routineStepEntries: [],
        goals: [], milestones: [],
    }
}
