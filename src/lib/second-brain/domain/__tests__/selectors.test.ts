import {
    isScheduledOn, isLoggableOn, weeklyTarget,
    habitStreak, habitCompletion, bestStreak, dayCompletion,
    goalProgress, goalPace,
    workoutVolume, estimatedOneRepMax, bestOneRepMax,
    routineProgress, dailyScore,
    lookupFrom, buildEntryIndex,
} from '../selectors'
import { toDateKey, weekDays } from '../../date'
import { searchSecondBrain } from '../selectors'
import { previousPerformance, activeWorkout, fitnessSummary, nextReviewInterval, studyMinutesFor, studyByDay, periodSummary, monthRange } from '../selectors'
import type { Habit, Goal, Milestone, Workout, WorkoutSet, RoutineStep, RoutineStepEntry } from '../types'

/**
 * Spec §73 prioritises exactly this logic: habit streaks, completion rates,
 * progress, volume and the daily score. It is all pure and deterministic, which
 * is what makes it worth testing and the components not.
 *
 * Dates are relative to "now" so the suite never rots, and `today` is injected
 * everywhere so nothing depends on when it runs.
 */

const day = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return toDateKey(d)
}
const TODAY = day(0)

const habit = (over: Partial<Habit> = {}): Habit => ({
    id: 'h', createdAt: '', updatedAt: '', archivedAt: null, name: 'H', icon: 'target',
    areaId: null, frequency: { kind: 'daily' }, timeOfDay: 'morning',
    target: null, unit: null, sortOrder: 0, ...over,
})

const doneOn = (keys: string[]) => (_id: string, d: string) => keys.includes(d)

const WEEKDAYS: Habit = habit({ frequency: { kind: 'weekdays', days: [1, 2, 3, 4, 5] } })
const GYM: Habit = habit({ frequency: { kind: 'weekly_count', timesPerWeek: 3 } })

describe('habit scheduling', () => {
    it('schedules a daily habit every day', () => {
        expect(isScheduledOn(habit(), '2026-08-02')).toBe(true)
    })

    it('skips unscheduled weekdays', () => {
        expect(isScheduledOn(WEEKDAYS, '2026-08-01')).toBe(false) // Saturday
        expect(isScheduledOn(WEEKDAYS, '2026-07-30')).toBe(true)  // Thursday
    })

    it('never marks a weekly-count habit due on a particular day', () => {
        // "Gym 5x a week" commits to no specific day, so no single day can be a
        // miss. Treating it as daily would make a perfect week read as 5/7.
        expect(isScheduledOn(GYM, '2026-07-30')).toBe(false)
        expect(isLoggableOn(GYM, '2026-07-30')).toBe(true)
    })

    it('reports the weekly target only for weekly-count habits', () => {
        expect(weeklyTarget(GYM)).toBe(3)
        expect(weeklyTarget(habit())).toBeNull()
    })
})

describe('habitStreak — per-day habits', () => {
    it('counts consecutive days', () => {
        expect(habitStreak(habit(), doneOn([]), TODAY)).toBe(0)
        expect(habitStreak(habit(), doneOn([day(0)]), TODAY)).toBe(1)
        expect(habitStreak(habit(), doneOn([day(0), day(1), day(2)]), TODAY)).toBe(3)
    })

    it('forgives today while it is still incomplete', () => {
        expect(habitStreak(habit(), doneOn([day(1), day(2)]), TODAY)).toBe(2)
    })

    it('breaks on a gap', () => {
        expect(habitStreak(habit(), doneOn([day(0), day(2), day(3)]), TODAY)).toBe(1)
        expect(habitStreak(habit(), doneOn([day(2)]), TODAY)).toBe(0)
    })

    it('does not break a weekday streak over the weekend', () => {
        const done: string[] = []
        for (let i = 0; i < 21; i++) if (isScheduledOn(WEEKDAYS, day(i))) done.push(day(i))
        expect(habitStreak(WEEKDAYS, doneOn(done), TODAY)).toBeGreaterThanOrEqual(10)
    })
})

describe('habitStreak — weekly-count habits', () => {
    it('counts whole weeks that hit the target', () => {
        const hits: string[] = []
        for (let w = 0; w < 4; w++) {
            const anchor = new Date()
            anchor.setDate(anchor.getDate() - w * 7)
            const days = weekDays(anchor).filter(d => d <= TODAY)
            hits.push(...days.slice(0, w === 0 ? 1 : 3))
        }
        // Three complete past weeks, and this week still in progress.
        expect(habitStreak(GYM, doneOn(hits), TODAY)).toBeGreaterThanOrEqual(3)
    })

    it('does not reset because the current week is unfinished', () => {
        const hits: string[] = []
        for (let w = 1; w < 3; w++) {
            const anchor = new Date()
            anchor.setDate(anchor.getDate() - w * 7)
            hits.push(...weekDays(anchor).slice(0, 3))
        }
        expect(habitStreak(GYM, doneOn(hits), TODAY)).toBeGreaterThan(0)
    })

    it('does not treat a single day as a weekly streak', () => {
        expect(habitStreak(GYM, doneOn([day(0)]), TODAY)).toBe(0)
    })
})

describe('habitCompletion', () => {
    const past = [day(3), day(2), day(1)]

    it('measures against scheduled days', () => {
        expect(habitCompletion(habit(), doneOn(past), past, TODAY).percent).toBe(100)
        expect(habitCompletion(habit(), doneOn(past.slice(0, 2)), past, TODAY).percent).toBe(67)
    })

    it('excludes future days from the denominator', () => {
        // Counting Thursday as a miss on Monday would drag every rate down.
        const range = [day(1), day(-5), day(-6)]
        expect(habitCompletion(habit(), doneOn([day(1)]), range, TODAY).expected).toBe(1)
    })

    it('reports zero rather than NaN when nothing is scheduled', () => {
        expect(habitCompletion(WEEKDAYS, doneOn([]), ['2026-08-01'], TODAY).percent).toBe(0)
    })
})

describe('bestStreak', () => {
    const range = [day(4), day(3), day(2), day(1), day(0)]

    it('finds the longest run', () => {
        expect(bestStreak(habit(), doneOn(range), range)).toBe(5)
        expect(bestStreak(habit(), doneOn([day(4), day(2), day(1), day(0)]), range)).toBe(3)
        expect(bestStreak(habit(), doneOn([]), range)).toBe(0)
    })
})

describe('dayCompletion', () => {
    it('counts only habits due that day', () => {
        const habits = [habit({ id: 'a' }), WEEKDAYS]
        const saturday = '2026-08-01'
        expect(dayCompletion(habits, doneOn([]), saturday).expected).toBe(1)
    })

    it('credits a weekly-count habit on a day it was actually done', () => {
        // A gym session shouldn't be invisible just because no day was required.
        const habits = [{ ...GYM, id: 'gym' }]
        const result = dayCompletion(habits, doneOn([TODAY]), TODAY)
        expect(result.done).toBe(1)
        expect(result.percent).toBe(100)
    })
})

describe('goalProgress', () => {
    const goal = (over: Partial<Goal> = {}): Goal => ({
        id: 'g', createdAt: '', updatedAt: '', archivedAt: null, title: 'G', why: '',
        horizon: 'quarterly', status: 'active', areaId: null,
        startDate: day(50), targetDate: day(-50), metric: 'x', target: 100, current: 40, ...over,
    })
    const milestone = (id: string, done: boolean): Milestone => ({
        id, goalId: 'g', title: '', targetDate: null,
        completedAt: done ? 'x' : null, sortOrder: 0, createdAt: '', updatedAt: '',
    })

    it('measures against the target when there is one', () => {
        expect(goalProgress(goal(), [])).toBe(40)
        expect(goalProgress(goal({ current: 250 }), [])).toBe(100)
    })

    it('falls back to milestones when there is no metric', () => {
        const untargeted = goal({ target: null, metric: null })
        const milestones = [milestone('a', true), milestone('b', false), milestone('c', true), milestone('d', false)]
        expect(goalProgress(untargeted, milestones)).toBe(50)
        expect(goalProgress(untargeted, [])).toBe(0)
    })

    it('flags a goal running behind its elapsed time', () => {
        expect(goalPace(goal({ startDate: day(90), targetDate: day(-10), current: 20 }), [], TODAY).behind).toBe(true)
        expect(goalPace(goal({ startDate: day(50), targetDate: day(-50), current: 55 }), [], TODAY).behind).toBe(false)
    })
})

describe('fitness', () => {
    const set = (weight: number | null, reps: number | null): WorkoutSet => ({
        id: 's', createdAt: '', updatedAt: '', workoutId: 'w', exerciseId: 'e',
        setNumber: 1, weight, reps, durationSeconds: null, completedAt: null,
    })

    it('sums volume as weight x reps', () => {
        expect(workoutVolume([set(60, 8), set(60, 6), set(50, 10)])).toBe(1340)
        expect(workoutVolume([set(null, 10), set(40, 5)])).toBe(200)
    })

    it('estimates one-rep max with Epley', () => {
        expect(estimatedOneRepMax(100, 1)).toBe(100)
        expect(estimatedOneRepMax(100, 5)).toBe(116.7)
    })

    it('refuses rep counts where the formula stops being meaningful', () => {
        // Beyond ~12 reps Epley is optimistic enough to invent personal bests.
        expect(estimatedOneRepMax(100, 20)).toBeNull()
        expect(estimatedOneRepMax(0, 5)).toBeNull()
    })

    it('takes the best estimate across sets', () => {
        expect(bestOneRepMax([set(60, 8), set(70, 3), set(65, 5)], 'e')).toBe(estimatedOneRepMax(70, 3))
        expect(bestOneRepMax([set(60, 8)], 'other')).toBeNull()
    })
})

describe('routineProgress', () => {
    const step = (id: string, order: number): RoutineStep => ({
        id, routineId: 'r', title: id, estimatedMinutes: null, sortOrder: order,
        createdAt: '', updatedAt: '',
    })
    const entry = (stepId: string, date: string): RoutineStepEntry => ({
        stepId, date, completedAt: 'x',
    })

    it('counts completed steps for the given day only', () => {
        const steps = [step('a', 0), step('b', 1), step('c', 2)]
        const entries = [entry('a', TODAY), entry('b', day(1))]
        expect(routineProgress(steps, entries, TODAY)).toEqual({ done: 1, expected: 3, percent: 33 })
    })

    it('reports zero for a routine with no steps', () => {
        expect(routineProgress([], [], TODAY).percent).toBe(0)
    })
})

describe('dailyScore', () => {
    const base = {
        habits: [habit({ id: 'h1' }), habit({ id: 'h2' })],
        habitEntries: [{ habitId: 'h1', date: TODAY, completed: true, value: null }],
        routines: [], routineSteps: [], routineStepEntries: [],
        studySessions: [], workouts: [],
    }

    it('scores the proportion of what was actually scheduled', () => {
        expect(dailyScore(base, TODAY).value).toBe(50)
    })

    it('reaches 100 on a day with no workout or study scheduled', () => {
        // A planned rest day must be able to score full marks; otherwise the
        // score measures compliance rather than the day.
        const perfect = {
            ...base,
            habitEntries: [
                { habitId: 'h1', date: TODAY, completed: true, value: null },
                { habitId: 'h2', date: TODAY, completed: true, value: null },
            ],
        }
        expect(dailyScore(perfect, TODAY).value).toBe(100)
    })

    it('drops components with nothing scheduled and renormalises', () => {
        const score = dailyScore(base, TODAY)
        expect(score.components.every(c => c.total > 0)).toBe(true)
        expect(score.components.map(c => c.label)).toEqual(['Habits'])
    })

    it('returns zero rather than NaN with nothing scheduled at all', () => {
        const empty = {
            habits: [], habitEntries: [], routines: [], routineSteps: [],
            routineStepEntries: [], studySessions: [], workouts: [],
        }
        expect(dailyScore(empty, TODAY).value).toBe(0)
    })

    it('always shows its working', () => {
        // Spec §29: a score the user cannot decompose is a score they cannot trust.
        const score = dailyScore(base, TODAY)
        expect(score.components.length).toBeGreaterThan(0)
        for (const component of score.components) {
            expect(component.done).toBeLessThanOrEqual(component.total)
        }
    })
})

describe('entry index', () => {
    it('ignores entries explicitly marked incomplete', () => {
        const isDone = lookupFrom(buildEntryIndex([
            { habitId: 'a', date: TODAY, completed: true, value: null },
            { habitId: 'b', date: TODAY, completed: false, value: null },
        ]))
        expect(isDone('a', TODAY)).toBe(true)
        expect(isDone('b', TODAY)).toBe(false)
    })
})

describe('previousPerformance', () => {
    const workout = (id: string, daysAgo: number, finished = true): Workout => {
        const started = new Date()
        started.setDate(started.getDate() - daysAgo)
        return {
            id, createdAt: '', updatedAt: '', templateId: null, name: id,
            startedAt: started.toISOString(),
            finishedAt: finished ? started.toISOString() : null,
            notes: '', rating: null,
        }
    }
    const set = (workoutId: string, weight: number, reps: number): WorkoutSet => ({
        id: `${workoutId}_${weight}_${reps}`, createdAt: '', updatedAt: '',
        workoutId, exerciseId: 'bench', setNumber: 1, weight, reps,
        durationSeconds: null, completedAt: 'x',
    })

    it('returns the best set of the most recent session, by estimated 1RM', () => {
        const workouts = [workout('w1', 7), workout('w2', 2)]
        const sets = [set('w1', 60, 8), set('w2', 62.5, 6), set('w2', 57.5, 10)]

        // Not simply the heaviest: Epley puts 57.5x10 at 76.7kg and 62.5x6 at
        // 75kg, so the lighter-but-longer set is the one to beat.
        expect(previousPerformance(workouts, sets, 'bench')).toMatchObject({ weight: 57.5, reps: 10 })
    })

    it('prefers the heavier set when reps are equal', () => {
        const workouts = [workout('w1', 2)]
        const sets = [set('w1', 60, 5), set('w1', 65, 5)]
        expect(previousPerformance(workouts, sets, 'bench')).toMatchObject({ weight: 65, reps: 5 })
    })

    it('excludes the session in progress', () => {
        // Otherwise the reference column shows the set you just typed.
        const workouts = [workout('done', 3), workout('current', 0, false)]
        const sets = [set('done', 60, 8), set('current', 100, 1)]

        expect(previousPerformance(workouts, sets, 'bench', 'current')).toMatchObject({ weight: 60 })
    })

    it('returns null when the exercise has never been performed', () => {
        expect(previousPerformance([workout('w1', 3)], [], 'bench')).toBeNull()
    })

    it('skips sessions that did not include the exercise', () => {
        const workouts = [workout('legs', 1), workout('push', 5)]
        const sets = [set('push', 60, 5)]
        expect(previousPerformance(workouts, sets, 'bench')).toMatchObject({ weight: 60 })
    })
})

describe('activeWorkout', () => {
    const w = (id: string, finished: boolean): Workout => ({
        id, createdAt: '', updatedAt: '', templateId: null, name: id,
        startedAt: new Date().toISOString(),
        finishedAt: finished ? new Date().toISOString() : null,
        notes: '', rating: null,
    })

    it('finds the unfinished session', () => {
        expect(activeWorkout([w('a', true), w('b', false)])?.id).toBe('b')
    })

    it('returns null when everything is finished', () => {
        expect(activeWorkout([w('a', true)])).toBeNull()
    })
})

describe('fitnessSummary', () => {
    const workout = (daysAgo: number): Workout => {
        const started = new Date()
        started.setDate(started.getDate() - daysAgo)
        return {
            id: `w${daysAgo}`, createdAt: '', updatedAt: '', templateId: null,
            name: 'session', startedAt: started.toISOString(),
            finishedAt: started.toISOString(), notes: '', rating: null,
        }
    }

    it('uses a rolling 30-day window, not the calendar month', () => {
        // A calendar window collapses to near-zero every time the month rolls
        // over, which made the headline volume read 0 on the 1st.
        const summary = fitnessSummary([workout(2), workout(20), workout(45)], [], TODAY)
        expect(summary.last30Days).toBe(2)
    })

    it('counts week streaks, not day streaks', () => {
        // Nobody trains daily; a day streak would read zero for any sane program.
        const summary = fitnessSummary([workout(1), workout(8), workout(15)], [], TODAY)
        expect(summary.weekStreak).toBeGreaterThanOrEqual(2)
    })

    it('is empty-safe', () => {
        const summary = fitnessSummary([], [], TODAY)
        expect(summary).toMatchObject({ thisWeek: 0, last30Days: 0, totalVolume: 0 })
    })
})

describe('nextReviewInterval', () => {
    it('brings a shaky topic straight back', () => {
        // Low confidence resets to the front of the queue regardless of history,
        // otherwise a topic you have "reviewed" ten times badly keeps receding.
        expect(nextReviewInterval(1, 8)).toBe(1)
        expect(nextReviewInterval(2, 8)).toBe(1)
    })

    it('expands the interval as confidence and history grow', () => {
        expect(nextReviewInterval(3, 0)).toBe(2)
        expect(nextReviewInterval(3, 1)).toBe(4)
        expect(nextReviewInterval(3, 2)).toBe(8)
        // A solid rating starts from a longer base.
        expect(nextReviewInterval(5, 0)).toBe(4)
        expect(nextReviewInterval(5, 2)).toBe(16)
    })

    it('caps so a topic never disappears for years', () => {
        expect(nextReviewInterval(5, 50)).toBe(90)
    })
})

describe('study aggregation', () => {
    const session = (id: string, itemId: string, date: string, minutes: number) => ({
        id, createdAt: '', updatedAt: '', learningItemId: itemId, date, minutes,
        summary: '', confidence: 3,
    })

    it('totals minutes per item', () => {
        const sessions = [
            session('a', 'x', day(1), 60),
            session('b', 'x', day(2), 30),
            session('c', 'y', day(1), 90),
        ]
        expect(studyMinutesFor(sessions, 'x')).toBe(90)
        expect(studyMinutesFor(sessions, 'missing')).toBe(0)
    })

    it('returns a point for every day, including zeroes', () => {
        // A gap in the axis would misread as "no data" rather than "no study".
        const days = [day(2), day(1), day(0)]
        const result = studyByDay([session('a', 'x', day(1), 45)], days)
        expect(result).toEqual([
            { date: day(2), minutes: 0 },
            { date: day(1), minutes: 45 },
            { date: day(0), minutes: 0 },
        ])
    })
})

describe('periodSummary', () => {
    const days = [day(3), day(2), day(1), day(0)]

    const base = {
        habits: [habit({ id: 'daily' }), habit({ id: 'weekday', frequency: { kind: 'weekdays', days: [1,2,3,4,5] } })],
        habitEntries: days.map(d => ({ habitId: 'daily', date: d, completed: true, value: null })),
        routines: [], routineSteps: [], routineStepEntries: [],
        workouts: [], workoutSets: [], studySessions: [],
        journalEntries: [], goals: [], milestones: [],
    }

    it('weights habit completion rather than averaging percentages', () => {
        // A habit scheduled once a week must not count as much as a daily one.
        // 'daily' is 4/4; 'weekday' contributes its scheduled days, none done.
        const summary = periodSummary(base, days, TODAY)
        expect(summary.habitCompletion.done).toBe(4)
        expect(summary.habitCompletion.expected).toBeGreaterThan(4)
        expect(summary.habitCompletion.percent).toBeLessThan(100)
    })

    it('reports per-habit stats alongside the total', () => {
        const summary = periodSummary(base, days, TODAY)
        expect(summary.habits).toHaveLength(2)
        expect(summary.habits.find(h => h.habitId === 'daily')?.completion.percent).toBe(100)
    })

    it('averages only the ratings that were actually supplied', () => {
        const withJournal = {
            ...base,
            journalEntries: [
                { id: 'a', createdAt: '', updatedAt: '', date: day(1), mood: 4, energy: null,
                  intention: '', biggestWin: '', wentWell: '', couldImprove: '', learned: '',
                  gratitude: '', tomorrowPriority: '', dayRating: 8, freeform: '' },
                { id: 'b', createdAt: '', updatedAt: '', date: day(2), mood: null, energy: null,
                  intention: '', biggestWin: '', wentWell: '', couldImprove: '', learned: '',
                  gratitude: '', tomorrowPriority: '', dayRating: null, freeform: '' },
            ],
        }
        const summary = periodSummary(withJournal, days, TODAY)
        expect(summary.journalEntries).toBe(2)
        // Only one entry rated the day, so the mean is that rating — not 4.
        expect(summary.averageDayRating).toBe(8)
        expect(summary.averageMood).toBe(4)
    })

    it('returns nulls rather than NaN when nothing was rated', () => {
        const summary = periodSummary(base, days, TODAY)
        expect(summary.averageDayRating).toBeNull()
        expect(summary.averageMood).toBeNull()
    })

    it('is empty-safe', () => {
        const empty = { ...base, habits: [], habitEntries: [] }
        const summary = periodSummary(empty, days, TODAY)
        expect(summary.habitCompletion.percent).toBe(0)
        expect(summary.workouts).toBe(0)
    })
})

describe('monthRange', () => {
    it('covers the whole month', () => {
        expect(monthRange(new Date(2026, 6, 15))).toHaveLength(31)
        expect(monthRange(new Date(2026, 1, 10))).toHaveLength(28)
        expect(monthRange(new Date(2028, 1, 10))).toHaveLength(29)
        expect(monthRange(new Date(2026, 6, 15))[0]).toBe('2026-07-01')
    })
})

describe('searchSecondBrain', () => {
    const base = {
        habits: [], goals: [], areas: [], learningItems: [],
        resources: [], mediaItems: [], ideas: [], routines: [],
    }

    const habit = (id: string, name: string, archivedAt: string | null = null) =>
        ({ id, name, archivedAt } as unknown as Habit)

    it('ignores queries shorter than two characters', () => {
        const data = { ...base, habits: [habit('h1', 'Gym')] }
        expect(searchSecondBrain(data, 'G')).toHaveLength(0)
        expect(searchSecondBrain(data, '')).toHaveLength(0)
        expect(searchSecondBrain(data, 'Gy')).toHaveLength(1)
    })

    it('ranks prefix matches above substring matches', () => {
        const data = {
            ...base,
            habits: [habit('h1', 'Advanced reading'), habit('h2', 'Reading')],
        }
        expect(searchSecondBrain(data, 'read').map(h => h.title))
            .toEqual(['Reading', 'Advanced reading'])
    })

    it('excludes archived records', () => {
        const data = {
            ...base,
            habits: [habit('h1', 'Gym'), habit('h2', 'Gym membership', '2026-01-01T00:00:00.000Z')],
        }
        expect(searchSecondBrain(data, 'gym').map(h => h.id)).toEqual(['h1'])
    })

    it('is case insensitive and labels the kind', () => {
        const data = { ...base, habits: [habit('h1', 'Gym')] }
        const [hit] = searchSecondBrain(data, 'GYM')
        expect(hit.kind).toBe('Habit')
        expect(hit.href).toBe('/second-brain/habits')
    })

    it('respects the limit', () => {
        const data = {
            ...base,
            habits: Array.from({ length: 12 }, (_, i) => habit(`h${i}`, `Reading ${i}`)),
        }
        expect(searchSecondBrain(data, 'reading')).toHaveLength(8)
        expect(searchSecondBrain(data, 'reading', 3)).toHaveLength(3)
    })
})
