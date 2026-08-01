/**
 * Second Brain domain models.
 *
 * Scope decision, from auditing the repo before writing any of this:
 *
 * Mentra already owns Tasks, Projects, Calendar, Inbox, Time tracking (FocusSession),
 * Notes (Page/Block), Search and the ⌘K palette — all backed by Postgres via Prisma.
 * Re-implementing them here against localStorage would give the user two task lists
 * that never agree, and would repeat the duplication this repo already suffers from
 * (three kanban boards, two block editors). So Second Brain models only the domains
 * that genuinely do not exist yet, and *links* to the ones that do.
 *
 * Everything below is therefore new ground: goals, areas, routines, fitness,
 * learning, journal, reviews, ideas, resources, media and finance.
 *
 * These are written as the shapes a Prisma schema would take, so the eventual
 * migration is a transcription rather than a redesign. Ids are strings, dates that
 * represent a calendar day are `YYYY-MM-DD` strings, and dates that represent an
 * instant are ISO strings — the same split the existing habit code already uses.
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

/** Anything that can be put away without being destroyed. Spec §30. */
export interface Archivable {
    archivedAt: Timestamp | null
}

export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

// ─── Areas (PARA) ────────────────────────────────────────────────────────────

/** An ongoing responsibility with no end date. Spec §13. */
export interface Area extends Entity, Archivable {
    name: string
    /** Icon id from lib/second-brain/icons. */
    icon: string
    description: string
    /** What "good" looks like here — the standard being held. */
    standard: string
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export type GoalStatus = 'not_started' | 'active' | 'at_risk' | 'achieved' | 'paused' | 'abandoned'
export type GoalHorizon = 'annual' | 'quarterly' | 'monthly' | 'custom'

/**
 * An outcome, not an activity.
 *
 * `metric`/`target`/`current` exist so progress is measured rather than guessed —
 * spec §12 explicitly warns against goals that are decorative progress bars.
 * When `target` is null the goal falls back to milestone completion.
 */
export interface Goal extends Entity, Archivable {
    title: string
    /** The reason it matters. Surfaced prominently on the detail page. */
    why: string
    horizon: GoalHorizon
    status: GoalStatus
    areaId: string | null
    startDate: DayKey
    targetDate: DayKey
    /** e.g. "focused sessions", "kg", "books". Null for milestone-only goals. */
    metric: string | null
    target: number | null
    current: number
}

export interface Milestone extends Entity {
    goalId: string
    title: string
    targetDate: DayKey | null
    completedAt: Timestamp | null
    sortOrder: number
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening']

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
}

/**
 * How often a habit is expected.
 *
 * `weekly_count` is the one people actually want and most trackers omit: "gym 5x a
 * week, any days". Without it, going Tuesday instead of Monday reads as a failure.
 */
export type HabitFrequency =
    | { kind: 'daily' }
    /** JS weekday numbers, 0 = Sunday. Matches Task.recurrenceDays. */
    | { kind: 'weekdays'; days: number[] }
    | { kind: 'weekly_count'; timesPerWeek: number }

/**
 * Boolean habits have `target: null` — done or not.
 * Quantitative habits carry a target and unit: 2 hours of code, 3 litres of water.
 */
export interface Habit extends Entity, Archivable {
    name: string
    icon: string
    areaId: string | null
    frequency: HabitFrequency
    timeOfDay: TimeOfDay
    /** null = boolean habit. */
    target: number | null
    /** e.g. "hours", "litres", "pages". Null for boolean habits. */
    unit: string | null
    sortOrder: number
}

/**
 * One habit, one calendar day.
 *
 * Rows only exist for days with activity — absence means "not done", which keeps
 * storage from growing a row per habit per day merely because the user looked.
 */
export interface HabitEntry {
    habitId: string
    date: DayKey
    completed: boolean
    /** Amount logged for quantitative habits. */
    value: number | null
}

// ─── Routines ────────────────────────────────────────────────────────────────

/** An ordered sequence, distinct from a habit. Spec §15. */
export interface Routine extends Entity, Archivable {
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

// ─── Fitness ─────────────────────────────────────────────────────────────────

export type MuscleGroup =
    | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
    | 'legs' | 'core' | 'cardio' | 'full_body'

export interface Exercise extends Entity, Archivable {
    name: string
    muscleGroup: MuscleGroup
    equipment: string
    /** Distinguishes exercises logged as weight×reps from time/distance ones. */
    tracksWeight: boolean
}

/** A reusable workout shape, e.g. "Push — Chest, Shoulders & Triceps". */
export interface WorkoutTemplate extends Entity, Archivable {
    name: string
    /** Program this belongs to, e.g. "Push/Pull/Legs". Free text; no separate model. */
    program: string
    notes: string
    sortOrder: number
}

export interface TemplateExercise extends Entity {
    templateId: string
    exerciseId: string
    targetSets: number
    targetReps: string
    sortOrder: number
}

/** A performed session. `finishedAt: null` means it is in progress. */
export interface Workout extends Entity {
    templateId: string | null
    name: string
    startedAt: Timestamp
    finishedAt: Timestamp | null
    notes: string
    /** 1-5, how it felt. Null until completed. */
    rating: number | null
}

export interface WorkoutSet extends Entity {
    workoutId: string
    exerciseId: string
    setNumber: number
    weight: number | null
    reps: number | null
    /** Seconds, for cardio/planks. */
    durationSeconds: number | null
    completedAt: Timestamp | null
}

// ─── Learning ────────────────────────────────────────────────────────────────

export type LearningStatus = 'not_started' | 'learning' | 'practicing' | 'reviewing' | 'mastered'

export interface LearningItem extends Entity, Archivable {
    title: string
    category: string
    status: LearningStatus
    areaId: string | null
    goalId: string | null
    /** 0-100, user-set — genuine mastery isn't derivable from time spent. */
    progress: number
    /** Spaced-repetition scaffolding. Spec §20. */
    confidence: number
    lastReviewedAt: DayKey | null
    nextReviewAt: DayKey | null
    reviewCount: number
}

export interface StudySession extends Entity {
    learningItemId: string
    date: DayKey
    minutes: number
    summary: string
    /** 1-5 after the session. */
    confidence: number
}

// ─── Knowledge inputs ────────────────────────────────────────────────────────

export type ResourceType =
    | 'article' | 'website' | 'video' | 'course' | 'documentation'
    | 'tool' | 'pdf' | 'podcast' | 'other'

export type ResourceStatus = 'inbox' | 'to_consume' | 'consuming' | 'finished' | 'reference'

export interface Resource extends Entity, Archivable {
    title: string
    url: string
    type: ResourceType
    status: ResourceStatus
    areaId: string | null
    notes: string
    /** 1-5, null until rated. */
    rating: number | null
}

export type MediaType = 'book' | 'movie' | 'series' | 'podcast' | 'video'
export type MediaStatus = 'want' | 'in_progress' | 'completed' | 'dropped'

/**
 * Books carry author/progress; film and series don't.
 * Spec §22 warns against forcing book fields onto every media type, so the
 * book-only fields are explicitly nullable and the UI hides them by type.
 */
export interface MediaItem extends Entity, Archivable {
    title: string
    type: MediaType
    status: MediaStatus
    creator: string
    /** Books only: 0-100. */
    progress: number | null
    startedAt: DayKey | null
    finishedAt: DayKey | null
    rating: number | null
    keyIdeas: string
}

export type IdeaStatus = 'raw' | 'exploring' | 'promising' | 'planned' | 'converted'

export interface Idea extends Entity, Archivable {
    title: string
    description: string
    areaId: string | null
    status: IdeaStatus
    /** 1-5 each; the pair is what makes an idea list triage-able. */
    potential: number
    effort: number
}

// ─── Reflection ──────────────────────────────────────────────────────────────

/**
 * One entry per day. Every field is optional in practice — spec §24 is explicit
 * that the user must not be forced to fill all of it.
 */
export interface JournalEntry extends Entity {
    date: DayKey
    /** 1-5. */
    mood: number | null
    energy: number | null
    intention: string
    biggestWin: string
    wentWell: string
    couldImprove: string
    learned: string
    gratitude: string
    tomorrowPriority: string
    /** 1-10. */
    dayRating: number | null
    freeform: string
}

export type ReviewKind = 'weekly' | 'monthly'

export interface Review extends Entity {
    kind: ReviewKind
    /** Monday of the week, or the 1st of the month. */
    periodStart: DayKey
    wins: string
    worked: string
    didntWork: string
    learned: string
    stop: string
    continueDoing: string
    start: string
    /** Free text, one per line. */
    nextPriorities: string
    completedAt: Timestamp | null
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type TransactionKind = 'income' | 'expense'

export type TransactionCategory =
    | 'housing' | 'food' | 'transport' | 'shopping' | 'technology'
    | 'fitness' | 'education' | 'entertainment' | 'subscriptions'
    | 'salary' | 'other'

export interface Transaction extends Entity {
    kind: TransactionKind
    /** Minor units (paise/cents) — floats do not belong in money. */
    amountMinor: number
    category: TransactionCategory
    date: DayKey
    description: string
}

// ─── The whole store ─────────────────────────────────────────────────────────

/** Every collection the repository persists. One shape, one version. */
export interface SecondBrainData {
    areas: Area[]
    goals: Goal[]
    milestones: Milestone[]
    habits: Habit[]
    habitEntries: HabitEntry[]
    routines: Routine[]
    routineSteps: RoutineStep[]
    routineStepEntries: RoutineStepEntry[]
    exercises: Exercise[]
    workoutTemplates: WorkoutTemplate[]
    templateExercises: TemplateExercise[]
    workouts: Workout[]
    workoutSets: WorkoutSet[]
    learningItems: LearningItem[]
    studySessions: StudySession[]
    resources: Resource[]
    mediaItems: MediaItem[]
    ideas: Idea[]
    journalEntries: JournalEntry[]
    reviews: Review[]
    transactions: Transaction[]
}

export type CollectionName = keyof SecondBrainData

/** Empty store — the shape every reader can rely on existing. */
export function emptyData(): SecondBrainData {
    return {
        areas: [], goals: [], milestones: [],
        habits: [], habitEntries: [],
        routines: [], routineSteps: [], routineStepEntries: [],
        exercises: [], workoutTemplates: [], templateExercises: [],
        workouts: [], workoutSets: [],
        learningItems: [], studySessions: [],
        resources: [], mediaItems: [], ideas: [],
        journalEntries: [], reviews: [], transactions: [],
    }
}
