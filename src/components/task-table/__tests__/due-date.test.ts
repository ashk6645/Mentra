import { dueDatePatch, dueLabel, isOverdue, priorityRank, timeOf } from '../due-date'

// jest.setup pins TZ to UTC, so local and ISO times line up in these fixtures.
const NOW = new Date('2026-09-26T10:00:00.000Z')

const task = (dueDate: string | null, scheduledStart: string | null = null, completed = false) => ({
    dueDate, scheduledStart, completed, durationMinutes: 45,
})

describe('timeOf', () => {
    it('reads the scheduled start first, then a due date carrying a time', () => {
        expect(timeOf(task('2026-09-26T00:00:00.000Z', '2026-09-26T15:30:00.000Z'))).toBe('15:30')
        expect(timeOf(task('2026-09-26T09:15:00.000Z'))).toBe('09:15')
    })

    it('treats midnight as "no time"', () => {
        expect(timeOf(task('2026-09-26T00:00:00.000Z'))).toBeNull()
    })
})

describe('dueLabel', () => {
    // "Today" is judged against the real clock, so pin it.
    beforeAll(() => jest.useFakeTimers().setSystemTime(NOW))
    afterAll(() => jest.useRealTimers())

    it('names nearby days and keeps the time', () => {
        expect(dueLabel(task('2026-09-26T00:00:00.000Z'), NOW)).toBe('Today')
        expect(dueLabel(task('2026-09-27T14:00:00.000Z'), NOW)).toBe('Tomorrow, 2:00 PM')
        expect(dueLabel(task('2026-09-25T00:00:00.000Z'), NOW)).toBe('Yesterday')
    })

    it('shows the year only outside this one', () => {
        expect(dueLabel(task('2026-10-05T00:00:00.000Z'), NOW)).toBe('Mon 5 Oct')
        expect(dueLabel(task('2027-01-04T00:00:00.000Z'), NOW)).toBe('4 Jan 2027')
        expect(dueLabel(task(null), NOW)).toBeNull()
    })
})

describe('isOverdue', () => {
    it('does not call an untimed task due today overdue', () => {
        expect(isOverdue(task('2026-09-26T00:00:00.000Z'), NOW)).toBe(false)
        expect(isOverdue(task('2026-09-25T00:00:00.000Z'), NOW)).toBe(true)
    })

    it('compares a timed task against the clock', () => {
        expect(isOverdue(task('2026-09-26T09:00:00.000Z'), NOW)).toBe(true)
        expect(isOverdue(task('2026-09-26T11:00:00.000Z'), NOW)).toBe(false)
    })

    it('never flags finished work', () => {
        expect(isOverdue(task('2026-09-01T00:00:00.000Z', null, true), NOW)).toBe(false)
    })
})

describe('dueDatePatch', () => {
    const day = new Date('2026-10-02T00:00:00.000Z')

    it('moves an untimed task to the start of the new day', () => {
        expect(dueDatePatch(task('2026-09-26T00:00:00.000Z'), day)).toEqual({ dueDate: '2026-10-02T00:00:00.000Z' })
    })

    it('keeps the time of day and duration of a time-blocked task', () => {
        expect(dueDatePatch(task('2026-09-26T15:30:00.000Z', '2026-09-26T15:30:00.000Z'), day)).toEqual({
            dueDate: '2026-10-02T15:30:00.000Z',
            scheduledStart: '2026-10-02T15:30:00.000Z',
            scheduledEnd: '2026-10-02T16:15:00.000Z',
        })
    })

    it('keeps a due time without inventing a schedule', () => {
        expect(dueDatePatch(task('2026-09-26T09:15:00.000Z'), day)).toEqual({ dueDate: '2026-10-02T09:15:00.000Z' })
    })

    it('clears the time along with the date', () => {
        expect(dueDatePatch(task('2026-09-26T15:30:00.000Z', '2026-09-26T15:30:00.000Z'), null)).toEqual({
            dueDate: null, scheduledStart: null, scheduledEnd: null,
        })
    })
})

describe('priorityRank', () => {
    it('orders urgent highest and unknown values as none', () => {
        expect(priorityRank('urgent')).toBeGreaterThan(priorityRank('high'))
        expect(priorityRank('low')).toBe(1)
        expect(priorityRank(null)).toBe(0)
        expect(priorityRank('whatever')).toBe(0)
    })
})
