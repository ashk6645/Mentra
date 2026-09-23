import {
    isScheduledOn, isLoggableOn, weeklyTarget, frequencyLabel, daysLabel,
    habitStreak, habitCompletion, dayCompletion, weekHits, isDueToday,
    goalProgress, goalPace,
    routineProgress, routineMinutes, dailyScore,
    lookupFrom, buildEntryIndex, searchSecondBrain,
} from '../selectors'
import { toDateKey, weekDays } from '../../date'
import type { Habit, Goal, Milestone, RoutineStep, RoutineStepEntry } from '../types'

/**
 * The logic worth testing is here: streaks, completion rates, pace and the daily
 * score. It is all pure and deterministic, which is what makes it worth testing
 * and the components not.
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
    id: 'h', createdAt: '', updatedAt: '', name: 'H', icon: 'target',
    frequency: { kind: 'daily' }, timeOfDay: 'morning', sortOrder: 0, ...over,
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

    it('never marks a weekly-count habit due on a particular day, but lets any day count', () => {
        expect(isScheduledOn(GYM, '2026-07-30')).toBe(false)
        expect(isLoggableOn(GYM, '2026-07-30')).toBe(true)
        expect(isLoggableOn(WEEKDAYS, '2026-08-01')).toBe(false)
    })

    it('reports the weekly target only for weekly-count habits', () => {
        expect(weeklyTarget(GYM)).toBe(3)
        expect(weeklyTarget(habit())).toBeNull()
    })
})

describe('frequency labels', () => {
    it('names the common shapes', () => {
        expect(frequencyLabel(habit())).toBe('Every day')
        expect(frequencyLabel(WEEKDAYS)).toBe('Weekdays')
        expect(frequencyLabel(GYM)).toBe('3× a week')
        expect(daysLabel([0, 6])).toBe('Weekends')
        expect(daysLabel([])).toBe('Every day')
    })

    it('lists other days Monday-first', () => {
        expect(daysLabel([0, 1, 3])).toBe('Mon, Wed, Sun')
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
        for (let w = 1; w < 4; w++) {
            const anchor = new Date()
            anchor.setDate(anchor.getDate() - w * 7)
            hits.push(...weekDays(anchor).slice(0, 3))
        }
        expect(habitStreak(GYM, doneOn(hits), TODAY)).toBe(3)
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
        const range = [day(1), day(-5), day(-6)]
        expect(habitCompletion(habit(), doneOn([day(1)]), range, TODAY).expected).toBe(1)
    })

    it('expects nothing of a weekly-count habit over a range entirely in the future', () => {
        expect(habitCompletion(GYM, doneOn([]), [day(-1), day(-2)], TODAY).expected).toBe(0)
    })

    it('does not count the days before a habit existed as misses', () => {
        const created = new Date()
        created.setDate(created.getDate() - 1)
        const fresh = habit({ createdAt: created.toISOString() })
        const week = [day(6), day(5), day(4), day(3), day(2), day(1), day(0)]

        expect(habitCompletion(fresh, doneOn([day(1)]), week, TODAY)).toEqual({ done: 1, expected: 2, percent: 50 })
    })

    it('reports zero rather than NaN when nothing is scheduled', () => {
        expect(habitCompletion(WEEKDAYS, doneOn([]), ['2026-08-01'], TODAY).percent).toBe(0)
    })
})

describe('today’s list', () => {
    // A fixed Thursday, so there are always three earlier days in its week.
    const THURSDAY = '2026-07-30'
    const earlier = ['2026-07-27', '2026-07-28', '2026-07-29']

    it('keeps a weekly-count habit on the list until the week is met', () => {
        expect(isDueToday(GYM, doneOn([]), THURSDAY)).toBe(true)
        expect(isDueToday(GYM, doneOn(earlier.slice(0, 2)), THURSDAY)).toBe(true)
    })

    it('drops it once met, unless it was ticked today', () => {
        expect(weekHits(GYM, doneOn(earlier), THURSDAY)).toBe(3)
        expect(isDueToday(GYM, doneOn(earlier), THURSDAY)).toBe(false)
        expect(isDueToday(GYM, doneOn([...earlier, THURSDAY]), THURSDAY)).toBe(true)
    })

    it('never lists an unscheduled per-day habit', () => {
        const never = habit({ frequency: { kind: 'weekdays', days: [] } })
        expect(isDueToday(never, doneOn([]), TODAY)).toBe(false)
    })
})

describe('dayCompletion', () => {
    it('counts only habits due that day', () => {
        const habits = [habit({ id: 'a' }), WEEKDAYS]
        expect(dayCompletion(habits, doneOn([]), '2026-08-01').expected).toBe(1)
    })

    it('credits a weekly-count habit on a day it was actually done', () => {
        const result = dayCompletion([{ ...GYM, id: 'gym' }], doneOn([TODAY]), TODAY)
        expect(result.done).toBe(1)
        expect(result.percent).toBe(100)
    })
})

describe('goals', () => {
    const goal = (over: Partial<Goal> = {}): Goal => ({
        id: 'g', createdAt: '', updatedAt: '', title: 'G', why: '', status: 'active',
        startDate: day(50), targetDate: day(-50), metric: 'x', target: 100, current: 40,
        sortOrder: 0, ...over,
    })
    const milestone = (id: string, done: boolean): Milestone => ({
        id, goalId: 'g', title: '', completedAt: done ? 'x' : null, sortOrder: 0,
        createdAt: '', updatedAt: '',
    })

    it('measures against the target when there is one', () => {
        expect(goalProgress(goal(), [])).toBe(40)
        expect(goalProgress(goal({ current: 250 }), [])).toBe(100)
    })

    it('falls back to milestones when there is no target', () => {
        const untargeted = goal({ target: null, metric: null })
        const milestones = [milestone('a', true), milestone('b', false), milestone('c', true), milestone('d', false)]
        expect(goalProgress(untargeted, milestones)).toBe(50)
        expect(goalProgress(untargeted, [])).toBe(0)
    })

    it('treats an achieved goal as complete whatever the numbers say', () => {
        expect(goalProgress(goal({ status: 'achieved', current: 10 }), [])).toBe(100)
    })

    it('flags an active goal running behind its elapsed time', () => {
        expect(goalPace(goal({ startDate: day(90), targetDate: day(-10), current: 20 }), [], TODAY).behind).toBe(true)
        expect(goalPace(goal({ startDate: day(50), targetDate: day(-50), current: 55 }), [], TODAY).behind).toBe(false)
    })

    it('never calls a paused goal behind', () => {
        const parked = goal({ status: 'paused', startDate: day(90), targetDate: day(-10), current: 20 })
        expect(goalPace(parked, [], TODAY).behind).toBe(false)
    })

    it('counts the days left, negative once overdue', () => {
        expect(goalPace(goal({ targetDate: day(-12) }), [], TODAY).daysLeft).toBe(12)
        expect(goalPace(goal({ targetDate: day(3) }), [], TODAY).daysLeft).toBe(-3)
    })
})

describe('routines', () => {
    const step = (id: string, minutes: number | null = null): RoutineStep => ({
        id, routineId: 'r', title: id, estimatedMinutes: minutes, sortOrder: 0,
        createdAt: '', updatedAt: '',
    })
    const entry = (stepId: string, date: string): RoutineStepEntry => ({ stepId, date, completedAt: 'x' })

    it('counts completed steps for the given day only', () => {
        const steps = [step('a'), step('b'), step('c')]
        const entries = [entry('a', TODAY), entry('b', day(1))]
        expect(routineProgress(steps, entries, TODAY)).toEqual({ done: 1, expected: 3, percent: 33 })
    })

    it('reports zero for a routine with no steps', () => {
        expect(routineProgress([], [], TODAY).percent).toBe(0)
    })

    it('totals estimates, ignoring steps without one', () => {
        expect(routineMinutes([step('a', 5), step('b'), step('c', 10)])).toBe(15)
    })
})

describe('dailyScore', () => {
    const base = {
        habits: [habit({ id: 'h1' }), habit({ id: 'h2' })],
        habitEntries: [{ habitId: 'h1', date: TODAY }],
        routines: [], routineSteps: [], routineStepEntries: [],
    }

    it('scores the proportion of what was actually scheduled', () => {
        expect(dailyScore(base, TODAY).value).toBe(50)
    })

    it('reaches 100 on a day with no routine scheduled', () => {
        const perfect = { ...base, habitEntries: [{ habitId: 'h1', date: TODAY }, { habitId: 'h2', date: TODAY }] }
        expect(dailyScore(perfect, TODAY).value).toBe(100)
    })

    it('drops components with nothing scheduled and shows its working', () => {
        const score = dailyScore(base, TODAY)
        expect(score.components.map(c => c.label)).toEqual(['Habits'])
    })

    it('returns zero rather than NaN with nothing scheduled at all', () => {
        const empty = { habits: [], habitEntries: [], routines: [], routineSteps: [], routineStepEntries: [] }
        expect(dailyScore(empty, TODAY).value).toBe(0)
    })
})

describe('entry index', () => {
    it('answers by habit and day', () => {
        const isDone = lookupFrom(buildEntryIndex([{ habitId: 'a', date: TODAY }]))
        expect(isDone('a', TODAY)).toBe(true)
        expect(isDone('a', day(1))).toBe(false)
        expect(isDone('b', TODAY)).toBe(false)
    })
})

describe('searchSecondBrain', () => {
    const named = (id: string, name: string) => habit({ id, name })
    const base = { habits: [] as Habit[], routines: [], goals: [] }

    it('ignores queries shorter than two characters', () => {
        const data = { ...base, habits: [named('h1', 'Gym')] }
        expect(searchSecondBrain(data, 'G')).toHaveLength(0)
        expect(searchSecondBrain(data, 'Gy')).toHaveLength(1)
    })

    it('ranks prefix matches above substring matches', () => {
        const data = { ...base, habits: [named('h1', 'Advanced reading'), named('h2', 'Reading')] }
        expect(searchSecondBrain(data, 'read').map(h => h.title)).toEqual(['Reading', 'Advanced reading'])
    })

    it('links a goal straight to its detail', () => {
        const goal = {
            id: 'g1', createdAt: '', updatedAt: '', title: 'Launch', why: '', status: 'active' as const,
            startDate: TODAY, targetDate: TODAY, metric: null, target: null, current: 0, sortOrder: 0,
        }
        const [hit] = searchSecondBrain({ ...base, goals: [goal] }, 'lau')
        expect(hit.kind).toBe('Goal')
        expect(hit.href).toBe('/second-brain/goals?goal=g1')
    })

    it('respects the limit', () => {
        const data = { ...base, habits: Array.from({ length: 12 }, (_, i) => named(`h${i}`, `Reading ${i}`)) }
        expect(searchSecondBrain(data, 'reading')).toHaveLength(8)
        expect(searchSecondBrain(data, 'reading', 3)).toHaveLength(3)
    })
})
