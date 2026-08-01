import type {
    DayKey, Habit, HabitEntry, Goal, Milestone, Routine, RoutineStep,
    RoutineStepEntry, Workout, WorkoutSet, StudySession, SecondBrainData,
} from './types'
import { toDateKey, fromDateKey, todayKey, weekDays, weekdayOf } from '../date'

/**
 * Derived analytics.
 *
 * Every function here is pure over its inputs — no storage, no clock beyond an
 * injectable `today`. That is what makes them testable, and it keeps business
 * logic out of JSX where the same calculation would otherwise get re-derived
 * slightly differently in three components (spec §54, §57).
 */

// ─── Habit scheduling ────────────────────────────────────────────────────────

/**
 * Is this habit expected on this specific day?
 *
 * `weekly_count` deliberately returns false: "gym 5× a week" does not commit you
 * to any particular day, so no individual day can be a miss. Treating it as
 * scheduled-every-day would make a perfectly good week read as 5/7. Progress for
 * those habits is measured per week — see `weeklyTarget` below.
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

/** True when the habit is measured weekly rather than per-day. */
export const isWeeklyCount = (habit: Habit): boolean => habit.frequency.kind === 'weekly_count'

/** Times per week expected, or null for per-day habits. */
export function weeklyTarget(habit: Habit): number | null {
    return habit.frequency.kind === 'weekly_count' ? habit.frequency.timesPerWeek : null
}

/**
 * Days a habit *may* be logged on.
 *
 * For weekly-count habits every day is loggable even though none is required —
 * which is exactly why `isScheduledOn` and this are separate questions.
 */
export function isLoggableOn(habit: Habit, date: DayKey): boolean {
    return isWeeklyCount(habit) || isScheduledOn(habit, date)
}

// ─── Habit completion ────────────────────────────────────────────────────────

/** Index entries once; every other selector reads through this. */
export function buildEntryIndex(entries: HabitEntry[]): Set<string> {
    const index = new Set<string>()
    for (const entry of entries) {
        if (entry.completed) index.add(`${entry.habitId}:${entry.date}`)
    }
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
 * Completion for one habit across a range of days.
 *
 * Future days are excluded from the denominator — counting Thursday as a miss on
 * Monday would drag every percentage down for no reason.
 */
export function habitCompletion(
    habit: Habit,
    isDone: DoneLookup,
    days: DayKey[],
    today: DayKey = todayKey()
): Completion {
    const past = days.filter(day => day <= today)

    if (isWeeklyCount(habit)) {
        // Expectation is per week, prorated across however many days are visible.
        const target = weeklyTarget(habit)!
        const done = past.filter(day => isDone(habit.id, day)).length
        const expected = Math.max(1, Math.round((target * past.length) / 7))
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
 * Two different meanings, deliberately:
 *
 * - Per-day habits: consecutive *scheduled* days completed. A weekday habit does
 *   not lose its streak over the weekend.
 * - Weekly-count habits: consecutive weeks that hit the target. Counting days
 *   would be meaningless for "5× a week", and counting the current week before it
 *   is over would mark every Monday as a broken streak.
 *
 * Today is forgiven while still incomplete — a streak shouldn't read as broken at
 * 9am simply because the day isn't over.
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
            // else: today, not done yet — skip without breaking.
        }

        cursor.setDate(cursor.getDate() - 1)
    }

    return streak
}

function weeklyStreak(habit: Habit, isDone: DoneLookup, today: DayKey): number {
    const target = weeklyTarget(habit)!
    let streak = 0
    const cursor = fromDateKey(today)

    // 53 weeks covers the same horizon as the daily cap.
    for (let week = 0; week < 53; week++) {
        const days = weekDays(cursor)
        const hits = days.filter(day => day <= today && isDone(habit.id, day)).length
        const isCurrentWeek = days.includes(today)

        if (hits >= target) {
            streak++
        } else if (!isCurrentWeek) {
            break
        }
        // The current week is still in progress — not yet a failure.

        cursor.setDate(cursor.getDate() - 7)
    }

    return streak
}

/** Longest run within a bounded range. Used on habit detail, not for live streaks. */
export function bestStreak(habit: Habit, isDone: DoneLookup, days: DayKey[]): number {
    let best = 0
    let run = 0

    for (const day of days) {
        if (!isScheduledOn(habit, day)) continue

        if (isDone(habit.id, day)) {
            run++
            if (run > best) best = run
        } else {
            run = 0
        }
    }

    return best
}

/** Completion across every habit for one day — the per-day progress figure. */
export function dayCompletion(
    habits: Habit[],
    isDone: DoneLookup,
    date: DayKey
): Completion {
    const due = habits.filter(habit => isScheduledOn(habit, date))
    const done = due.filter(habit => isDone(habit.id, date)).length

    // Weekly-count habits still count toward the day when they were actually done,
    // so a gym session on an unscheduled day isn't invisible.
    const bonus = habits.filter(
        habit => isWeeklyCount(habit) && isDone(habit.id, date)
    ).length

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
    const doneIds = new Set(
        entries.filter(entry => entry.date === date).map(entry => entry.stepId)
    )
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
 * Metric-backed goals measure against the target. Goals without a metric fall
 * back to milestone completion, so a goal is never a decorative bar with no
 * source of truth (spec §12).
 */
export function goalProgress(goal: Goal, milestones: Milestone[]): number {
    if (goal.target !== null && goal.target > 0) {
        return Math.min(100, Math.round((goal.current / goal.target) * 100))
    }

    const own = milestones.filter(m => m.goalId === goal.id)
    if (own.length === 0) return 0

    return Math.round((own.filter(m => m.completedAt !== null).length / own.length) * 100)
}

/**
 * Is the goal behind where it should be?
 *
 * Compares progress against elapsed time. A goal 20% done with 80% of its window
 * gone is at risk regardless of what its status field says — which is the whole
 * point of surfacing it rather than waiting for the user to notice.
 */
export function goalPace(
    goal: Goal,
    milestones: Milestone[],
    today: DayKey = todayKey()
): { progress: number; elapsed: number; behind: boolean } {
    const progress = goalProgress(goal, milestones)

    const start = fromDateKey(goal.startDate).getTime()
    const end = fromDateKey(goal.targetDate).getTime()
    const now = fromDateKey(today).getTime()

    const span = end - start
    const elapsed = span <= 0 ? 100 : Math.min(100, Math.max(0, Math.round(((now - start) / span) * 100)))

    // 10-point grace, so a goal isn't flagged the moment it slips a day.
    return { progress, elapsed, behind: elapsed - progress > 10 }
}

// ─── Fitness ─────────────────────────────────────────────────────────────────

/** Sum of weight × reps. The standard single number for "how much work". */
export function workoutVolume(sets: WorkoutSet[]): number {
    return sets.reduce(
        (total, set) => total + (set.weight ?? 0) * (set.reps ?? 0),
        0
    )
}

/**
 * Estimated one-rep max, Epley.
 *
 * Reliable up to about 10 reps and increasingly optimistic beyond, so sets above
 * 12 are excluded rather than reported as a personal best that never happened.
 */
export function estimatedOneRepMax(weight: number, reps: number): number | null {
    if (reps <= 0 || reps > 12 || weight <= 0) return null
    if (reps === 1) return weight

    return Math.round(weight * (1 + reps / 30) * 10) / 10
}

/** Best estimated 1RM for one exercise across all logged sets. */
export function bestOneRepMax(sets: WorkoutSet[], exerciseId: string): number | null {
    let best: number | null = null

    for (const set of sets) {
        if (set.exerciseId !== exerciseId) continue
        if (set.weight === null || set.reps === null) continue

        const estimate = estimatedOneRepMax(set.weight, set.reps)
        if (estimate !== null && (best === null || estimate > best)) best = estimate
    }

    return best
}

export const workoutDurationMinutes = (workout: Workout): number | null => {
    if (!workout.finishedAt) return null
    const ms = new Date(workout.finishedAt).getTime() - new Date(workout.startedAt).getTime()
    return Math.max(0, Math.round(ms / 60000))
}

/** Workouts finished within a range. */
export const workoutsInRange = (workouts: Workout[], days: DayKey[]): Workout[] => {
    const set = new Set(days)
    return workouts.filter(w => w.finishedAt !== null && set.has(toDateKey(new Date(w.startedAt))))
}

// ─── Learning ────────────────────────────────────────────────────────────────

export const studyMinutesInRange = (sessions: StudySession[], days: DayKey[]): number => {
    const set = new Set(days)
    return sessions.filter(s => set.has(s.date)).reduce((total, s) => total + s.minutes, 0)
}

/** Learning items whose review is due on or before `today`. Spec §20. */
export const dueForReview = <T extends { nextReviewAt: DayKey | null }>(
    items: T[],
    today: DayKey = todayKey()
): T[] => items.filter(item => item.nextReviewAt !== null && item.nextReviewAt <= today)

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
 * Components with nothing scheduled are dropped and the remaining weights are
 * renormalised, so a rest day isn't punished for having no workout. Spec §29
 * warns against false precision — this returns the parts as well as the total so
 * the UI can always show its working rather than asking to be trusted.
 */
export function dailyScore(
    data: Pick<SecondBrainData, 'habits' | 'habitEntries' | 'routines' | 'routineSteps' | 'routineStepEntries' | 'studySessions' | 'workouts'>,
    date: DayKey
): DailyScore {
    const isDone = lookupFrom(buildEntryIndex(data.habitEntries))
    const active = data.habits.filter(h => h.archivedAt === null)

    const habits = dayCompletion(active, isDone, date)

    const routinesToday = data.routines.filter(
        r => r.archivedAt === null && isRoutineScheduledOn(r, date)
    )
    const routineStepIds = new Set(
        data.routineSteps
            .filter(step => routinesToday.some(r => r.id === step.routineId))
            .map(step => step.id)
    )
    const routineSteps = data.routineSteps.filter(step => routineStepIds.has(step.id))
    const routines = routineProgress(routineSteps, data.routineStepEntries, date)

    /*
     * Only habits and routines. Two earlier candidates were removed deliberately:
     *
     * - Study and Training as standalone components each had `total: 1` on every
     *   day, which meant a rest day could never score 100 no matter how complete
     *   it was. A score that punishes a planned rest day is measuring compliance,
     *   not the day.
     * - They were also double counting. "Gym" and "Study" are habits, so a
     *   workout already moved the habit component; scoring it again weighted the
     *   same action twice.
     *
     * Training and study still surface everywhere else — they simply aren't a
     * second denominator here.
     */
    const raw: ScoreComponent[] = [
        { label: 'Habits', done: habits.done, total: habits.expected, weight: 0.6 },
        { label: 'Routines', done: routines.done, total: routines.expected, weight: 0.4 },
    ]

    const components = raw.filter(component => component.total > 0)
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)

    if (totalWeight === 0) return { value: 0, components: [] }

    const value = Math.round(
        components.reduce((sum, c) => sum + (c.done / c.total) * (c.weight / totalWeight), 0) * 100
    )

    return { value: Math.min(100, value), components }
}

// ─── Fitness, continued ──────────────────────────────────────────────────────

export interface ExercisePerformance {
    /** Best working set of that session, by estimated 1RM. */
    weight: number
    reps: number
    date: DayKey
}

/**
 * What you did last time on this exercise.
 *
 * The single most useful number in a gym app — without it you're guessing at the
 * rack. Excludes the workout currently in progress so it shows the previous
 * session rather than the set you just logged.
 */
export function previousPerformance(
    workouts: Workout[],
    sets: WorkoutSet[],
    exerciseId: string,
    excludeWorkoutId?: string
): ExercisePerformance | null {
    const finished = workouts
        .filter(w => w.finishedAt !== null && w.id !== excludeWorkoutId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

    for (const workout of finished) {
        const performed = sets.filter(
            s => s.workoutId === workout.id && s.exerciseId === exerciseId &&
                s.weight !== null && s.reps !== null
        )
        if (performed.length === 0) continue

        // Best set of that session, not the first — "last time" should mean your
        // top set, which is what you're trying to beat.
        const best = performed.reduce((top, set) => {
            const a = estimatedOneRepMax(set.weight!, set.reps!) ?? 0
            const b = estimatedOneRepMax(top.weight!, top.reps!) ?? 0
            return a > b ? set : top
        })

        return {
            weight: best.weight!,
            reps: best.reps!,
            date: toDateKey(new Date(workout.startedAt)),
        }
    }

    return null
}

/** Per-session best estimated 1RM, oldest first. Drives the progression chart. */
export function exerciseProgression(
    workouts: Workout[],
    sets: WorkoutSet[],
    exerciseId: string
): { date: DayKey; oneRepMax: number; volume: number }[] {
    return workouts
        .filter(w => w.finishedAt !== null)
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
        .map(workout => {
            const performed = sets.filter(s => s.workoutId === workout.id && s.exerciseId === exerciseId)
            if (performed.length === 0) return null

            const best = bestOneRepMax(performed, exerciseId)
            if (best === null) return null

            return {
                date: toDateKey(new Date(workout.startedAt)),
                oneRepMax: best,
                volume: workoutVolume(performed),
            }
        })
        .filter((point): point is { date: DayKey; oneRepMax: number; volume: number } => point !== null)
}

/** The workout currently in progress, if any. At most one can be open. */
export const activeWorkout = (workouts: Workout[]): Workout | null =>
    workouts.find(w => w.finishedAt === null) ?? null

export interface FitnessSummary {
    thisWeek: number
    /** Rolling 30-day count, not the calendar month — see fitnessSummary. */
    last30Days: number
    /** Consecutive weeks with at least one session. */
    weekStreak: number
    totalMinutes: number
    totalVolume: number
}

/**
 * Headline fitness numbers.
 *
 * Streak is counted in weeks rather than days: nobody trains daily, so a day
 * streak would read zero for anyone with a sane program.
 */
export function fitnessSummary(
    workouts: Workout[],
    sets: WorkoutSet[],
    today: DayKey = todayKey()
): FitnessSummary {
    const done = workouts.filter(w => w.finishedAt !== null)
    const dayOf = (w: Workout) => toDateKey(new Date(w.startedAt))

    const week = new Set(weekDays(fromDateKey(today)))
    const thisWeek = done.filter(w => week.has(dayOf(w))).length

    /*
     * Rolling 30 days, not the calendar month.
     *
     * A calendar window makes the headline volume collapse to near-zero every
     * time the month rolls over — on the 1st it reports one day of training as
     * though it were the whole picture. A rolling window answers the question
     * the user is actually asking: "how much have I been training lately".
     */
    const windowStart = fromDateKey(today)
    windowStart.setDate(windowStart.getDate() - 29)
    const windowStartKey = toDateKey(windowStart)

    const monthWorkouts = done.filter(w => dayOf(w) >= windowStartKey && dayOf(w) <= today)

    let weekStreak = 0
    const cursor = fromDateKey(today)
    for (let i = 0; i < 53; i++) {
        const days = new Set(weekDays(cursor))
        const trained = done.some(w => days.has(dayOf(w)))
        const isCurrent = days.has(today)

        if (trained) weekStreak++
        else if (!isCurrent) break

        cursor.setDate(cursor.getDate() - 7)
    }

    const monthIds = new Set(monthWorkouts.map(w => w.id))

    return {
        thisWeek,
        last30Days: monthWorkouts.length,
        weekStreak,
        totalMinutes: monthWorkouts.reduce((sum, w) => sum + (workoutDurationMinutes(w) ?? 0), 0),
        totalVolume: workoutVolume(sets.filter(s => monthIds.has(s.workoutId))),
    }
}

// ─── Learning, continued ─────────────────────────────────────────────────────

/** Total minutes studied on one item. */
export const studyMinutesFor = (sessions: StudySession[], learningItemId: string): number =>
    sessions.filter(s => s.learningItemId === learningItemId).reduce((sum, s) => sum + s.minutes, 0)

/**
 * Next review date from a confidence rating, expanding intervals.
 *
 * A deliberately small ladder rather than SM-2. Spec §20 warns against building a
 * scientific algorithm without justification, and the honest input here is a
 * 1-5 self-rating — which is far too coarse to feed a real scheduler. Doubling
 * intervals captures the useful half of spaced repetition at a fraction of the
 * complexity, and the shape can be swapped later without touching any caller.
 */
export function nextReviewInterval(confidence: number, reviewCount: number): number {
    // Low confidence resets to the front of the queue regardless of history.
    if (confidence <= 2) return 1

    const base = confidence >= 5 ? 4 : 2
    return Math.min(90, base * Math.pow(2, Math.min(reviewCount, 5)))
}

/** Study minutes per day across a range — the shape a bar chart wants. */
export function studyByDay(
    sessions: StudySession[],
    days: DayKey[]
): { date: DayKey; minutes: number }[] {
    const totals = new Map<DayKey, number>()
    for (const session of sessions) {
        totals.set(session.date, (totals.get(session.date) ?? 0) + session.minutes)
    }

    return days.map(date => ({ date, minutes: totals.get(date) ?? 0 }))
}

// ─── Period summaries ────────────────────────────────────────────────────────

export interface HabitPeriodStat {
    habitId: string
    name: string
    icon: string
    completion: Completion
    streak: number
}

export interface PeriodSummary {
    days: DayKey[]
    habits: HabitPeriodStat[]
    /** Weighted across every habit, not an average of averages. */
    habitCompletion: Completion
    workouts: number
    workoutMinutes: number
    studyMinutes: number
    studySessions: number
    routineCompletion: Completion
    journalEntries: number
    /** Mean day rating across entries that supplied one. Null if none did. */
    averageDayRating: number | null
    averageMood: number | null
    /** Goals that moved, and by how much, over the period. */
    goalsBehind: number
    goalsAchieved: number
}

/**
 * Everything a review needs, computed rather than typed.
 *
 * Spec §25 asks the review to summarise the period automatically — a guided
 * process, not a form. Every number here is derived from data the user already
 * produced, so opening a review costs nothing and the reflection prompts sit on
 * top of real evidence rather than memory.
 *
 * Habit completion is weighted (total done over total expected) rather than the
 * mean of each habit's percentage. Averaging percentages lets a habit scheduled
 * once a week count as much as one scheduled daily.
 */
export function periodSummary(
    data: Pick<SecondBrainData,
        'habits' | 'habitEntries' | 'routines' | 'routineSteps' | 'routineStepEntries' |
        'workouts' | 'workoutSets' | 'studySessions' | 'journalEntries' | 'goals' | 'milestones'>,
    days: DayKey[],
    today: DayKey = todayKey()
): PeriodSummary {
    const isDone = lookupFrom(buildEntryIndex(data.habitEntries))
    const activeHabits = data.habits.filter(h => h.archivedAt === null)

    const habits: HabitPeriodStat[] = activeHabits.map(habit => ({
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        completion: habitCompletion(habit, isDone, days, today),
        streak: habitStreak(habit, isDone, today),
    }))

    const habitTotals = habits.reduce(
        (acc, h) => ({ done: acc.done + h.completion.done, expected: acc.expected + h.completion.expected }),
        { done: 0, expected: 0 }
    )

    const dayset = new Set(days)
    const sessions = data.workouts.filter(
        w => w.finishedAt !== null && dayset.has(toDateKey(new Date(w.startedAt)))
    )

    const study = data.studySessions.filter(s => dayset.has(s.date))

    // Routine steps expected across the period, day by day — a routine that only
    // runs on weekdays must not be counted on a Sunday.
    let routineDone = 0
    let routineExpected = 0
    for (const day of days) {
        if (day > today) continue

        const scheduled = data.routines.filter(
            r => r.archivedAt === null && isRoutineScheduledOn(r, day)
        )
        const steps = data.routineSteps.filter(step =>
            scheduled.some(routine => routine.id === step.routineId)
        )
        const progress = routineProgress(steps, data.routineStepEntries, day)
        routineDone += progress.done
        routineExpected += progress.expected
    }

    const entries = data.journalEntries.filter(e => dayset.has(e.date))
    const ratings = entries.map(e => e.dayRating).filter((r): r is number => r !== null)
    const moods = entries.map(e => e.mood).filter((m): m is number => m !== null)

    const mean = (values: number[]) =>
        values.length === 0 ? null : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10

    const openGoals = data.goals.filter(
        g => g.archivedAt === null && (g.status === 'active' || g.status === 'at_risk')
    )

    return {
        days,
        habits,
        habitCompletion: {
            ...habitTotals,
            percent: habitTotals.expected === 0
                ? 0
                : Math.round((habitTotals.done / habitTotals.expected) * 100),
        },
        workouts: sessions.length,
        workoutMinutes: sessions.reduce((sum, w) => sum + (workoutDurationMinutes(w) ?? 0), 0),
        studyMinutes: study.reduce((sum, s) => sum + s.minutes, 0),
        studySessions: study.length,
        routineCompletion: {
            done: routineDone,
            expected: routineExpected,
            percent: routineExpected === 0 ? 0 : Math.round((routineDone / routineExpected) * 100),
        },
        journalEntries: entries.length,
        averageDayRating: mean(ratings),
        averageMood: mean(moods),
        goalsBehind: openGoals.filter(g => goalPace(g, data.milestones, today).behind).length,
        goalsAchieved: data.goals.filter(g => g.archivedAt === null && g.status === 'achieved').length,
    }
}

/** Every day of the month containing `date`, as keys. */
export function monthRange(date: Date): DayKey[] {
    const year = date.getFullYear()
    const month = date.getMonth()
    const count = new Date(year, month + 1, 0).getDate()

    return Array.from({ length: count }, (_, i) => toDateKey(new Date(year, month, i + 1)))
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchHit {
    id: string
    title: string
    /** Human label for the kind of thing, e.g. "Habit". */
    kind: string
    /** Where to send the user. */
    href: string
    /** Secondary line, when there is something worth showing. */
    detail?: string
}

/**
 * Global search across everything this store owns.
 *
 * Spec §32 wants results grouped by type, which the caller does — this returns a
 * flat, ranked list so the palette can slice it. Ranking puts prefix matches
 * above substring matches, because typing "gy" should surface "Gym" before
 * "Biology" no matter which was created first.
 */
export function searchSecondBrain(
    data: Pick<SecondBrainData,
        'habits' | 'goals' | 'areas' | 'learningItems' | 'resources' | 'mediaItems' | 'ideas' | 'routines'>,
    query: string,
    limit = 8
): SearchHit[] {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []

    const hits: { hit: SearchHit; rank: number }[] = []

    const consider = (
        title: string,
        kind: string,
        href: string,
        id: string,
        archivedAt: string | null,
        detail?: string
    ) => {
        if (archivedAt !== null) return

        const haystack = title.toLowerCase()
        const index = haystack.indexOf(needle)
        if (index === -1) return

        // 0 for a prefix match, 1 otherwise — a stable two-tier ranking rather
        // than a scoring function nobody can reason about.
        hits.push({ hit: { id, title, kind, href, detail }, rank: index === 0 ? 0 : 1 })
    }

    for (const h of data.habits) consider(h.name, 'Habit', '/second-brain/habits', h.id, h.archivedAt)
    for (const r of data.routines) consider(r.name, 'Routine', '/second-brain/routines', r.id, r.archivedAt)
    for (const g of data.goals) consider(g.title, 'Goal', '/second-brain/goals', g.id, g.archivedAt)
    for (const a of data.areas) consider(a.name, 'Area', '/second-brain/areas', a.id, a.archivedAt)
    for (const l of data.learningItems) consider(l.title, 'Topic', '/second-brain/learning', l.id, l.archivedAt, l.category)
    for (const r of data.resources) consider(r.title, 'Resource', '/second-brain/library', r.id, r.archivedAt, r.type)
    for (const m of data.mediaItems) consider(m.title, 'Media', '/second-brain/library', m.id, m.archivedAt, m.creator || m.type)
    for (const i of data.ideas) consider(i.title, 'Idea', '/second-brain/library', i.id, i.archivedAt)

    return hits
        .sort((a, b) => a.rank - b.rank || a.hit.title.localeCompare(b.hit.title))
        .slice(0, limit)
        .map(entry => entry.hit)
}
