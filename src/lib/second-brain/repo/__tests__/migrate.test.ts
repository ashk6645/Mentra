import { normalize } from '../migrate'
import { seedData } from '../seed'
import { emptyData } from '../../domain/types'

/**
 * `normalize` is the only thing standing between a blob written by an older
 * build and today's components, so it gets tested against the shapes those
 * builds actually wrote.
 */

const legacyHabit = (over: Record<string, unknown> = {}) => ({
    id: 'h1', createdAt: 'c', updatedAt: 'u', archivedAt: null, name: 'Gym', icon: 'dumbbell',
    areaId: 'area_1', frequency: { kind: 'daily' }, timeOfDay: 'morning',
    target: 2, unit: 'hours', sortOrder: 0, ...over,
})

describe('normalize', () => {
    it('returns an empty store for anything that is not an object', () => {
        expect(normalize(null)).toEqual(emptyData())
        expect(normalize('nope')).toEqual(emptyData())
        expect(normalize([])).toEqual(emptyData())
    })

    it('drops the collections that no longer exist', () => {
        const result = normalize({ habits: [], transactions: [{ id: 't' }], workouts: [{ id: 'w' }] })
        expect(Object.keys(result).sort()).toEqual(Object.keys(emptyData()).sort())
    })

    it('strips removed fields from records it keeps', () => {
        const [habit] = normalize({ habits: [legacyHabit()] }).habits
        expect(habit).toEqual({
            id: 'h1', createdAt: 'c', updatedAt: 'u', name: 'Gym', icon: 'dumbbell',
            frequency: { kind: 'daily' }, timeOfDay: 'morning', sortOrder: 0,
        })
    })

    it('drops archived records, and the history that hung off them', () => {
        const result = normalize({
            habits: [legacyHabit(), legacyHabit({ id: 'h2', archivedAt: '2026-01-01T00:00:00Z' })],
            habitEntries: [
                { habitId: 'h1', date: '2026-07-01', completed: true, value: null },
                { habitId: 'h2', date: '2026-07-01', completed: true, value: null },
            ],
        })
        expect(result.habits.map(h => h.id)).toEqual(['h1'])
        expect(result.habitEntries).toEqual([{ habitId: 'h1', date: '2026-07-01' }])
    })

    it('ignores entries an older build stored as explicitly not done, and duplicates', () => {
        const result = normalize({
            habits: [legacyHabit()],
            habitEntries: [
                { habitId: 'h1', date: '2026-07-01', completed: false },
                { habitId: 'h1', date: '2026-07-02', completed: true },
                { habitId: 'h1', date: '2026-07-02', completed: true },
            ],
        })
        expect(result.habitEntries).toEqual([{ habitId: 'h1', date: '2026-07-02' }])
    })

    it('moves a habit’s start back to its first logged day', () => {
        const [habit] = normalize({
            habits: [legacyHabit({ createdAt: '2026-07-20T09:00:00.000Z' })],
            habitEntries: [{ habitId: 'h1', date: '2026-07-01' }, { habitId: 'h1', date: '2026-07-10' }],
        }).habits
        expect(habit.createdAt.startsWith('2026-06-30') || habit.createdAt.startsWith('2026-07-01')).toBe(true)
    })

    it('collapses six goal statuses onto three', () => {
        const goal = (id: string, status: string) => ({
            id, title: id, status, startDate: '2026-01-01', targetDate: '2026-12-31',
            metric: null, target: null, current: 0,
        })
        const statuses = normalize({
            goals: [
                goal('a', 'not_started'), goal('b', 'at_risk'), goal('c', 'active'),
                goal('d', 'achieved'), goal('e', 'paused'), goal('f', 'abandoned'),
            ],
        }).goals.map(g => g.status)
        expect(statuses).toEqual(['active', 'active', 'active', 'achieved', 'paused', 'paused'])
    })

    it('gives a goal usable dates when the stored ones are missing', () => {
        const [goal] = normalize({ goals: [{ id: 'g', title: 'G', startDate: '2026-01-01' }] }).goals
        expect(goal.targetDate).toBe('2026-04-01')
    })

    it('turns a seven-day schedule into "every day"', () => {
        const [habit] = normalize({
            habits: [legacyHabit({ frequency: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } })],
        }).habits
        expect(habit.frequency).toEqual({ kind: 'daily' })
    })

    it('drops steps and milestones whose parent is gone', () => {
        const result = normalize({
            routines: [{ id: 'r1', name: 'Morning', days: [] }],
            routineSteps: [
                { id: 's1', routineId: 'r1', title: 'Water' },
                { id: 's2', routineId: 'missing', title: 'Orphan' },
            ],
            goals: [],
            milestones: [{ id: 'm1', goalId: 'missing', title: 'Orphan' }],
        })
        expect(result.routineSteps.map(s => s.id)).toEqual(['s1'])
        expect(result.milestones).toEqual([])
    })

    it('leaves current sample data exactly as it is', () => {
        const seed = seedData()
        expect(normalize(JSON.parse(JSON.stringify(seed)))).toEqual(seed)
    })
})
