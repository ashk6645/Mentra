import {
    emptyData,
    type Goal,
    type GoalStatus,
    type Habit,
    type HabitEntry,
    type Milestone,
    type Routine,
    type RoutineStep,
    type RoutineStepEntry,
    type SecondBrainData,
} from '../domain/types'
import { fromDateKey, toDateKey, todayKey } from '../date'

/**
 * Bring a stored blob up to the current shape.
 *
 * Earlier builds persisted twenty-one collections — fitness, finance, learning and
 * more — plus archived records and fields that no longer exist. Rather than bump
 * the storage key and throw away everyone's habit history, the blob is read
 * through this once on load:
 *
 * - Only the seven current collections survive. The rest is dropped.
 * - Archived records are dropped. There is no archive any more, so they would
 *   only reappear as if restored.
 * - Removed fields are stripped, so the next save writes a clean record.
 * - Goal statuses collapse onto the three that remain.
 *
 * Pure, so it is tested directly rather than through storage.
 */

type Loose = Record<string, unknown>

const isRecord = (value: unknown): value is Loose =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const list = (value: unknown): Loose[] => (Array.isArray(value) ? value.filter(isRecord) : [])

/** Archived in an older build — dropped rather than silently restored. */
const live = (record: Loose) => record.archivedAt === undefined || record.archivedAt === null

const text = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)

const num = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

const days = (value: unknown): number[] =>
    Array.isArray(value)
        ? value.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)
        : []

const timeOfDay = (value: unknown): Habit['timeOfDay'] =>
    value === 'afternoon' || value === 'evening' ? value : 'morning'

/** A `YYYY-MM-DD` string, or null — anything else would poison date maths downstream. */
const dayKey = (value: unknown): string | null =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null

function daysAfter(key: string, count: number): string {
    const date = fromDateKey(key)
    date.setDate(date.getDate() + count)
    return toDateKey(date)
}

const entity = (record: Loose) => ({
    id: text(record.id),
    createdAt: text(record.createdAt),
    updatedAt: text(record.updatedAt),
})

function frequency(value: unknown): Habit['frequency'] {
    if (!isRecord(value)) return { kind: 'daily' }

    if (value.kind === 'weekdays') {
        const picked = days(value.days)
        return picked.length === 0 || picked.length === 7
            ? { kind: 'daily' }
            : { kind: 'weekdays', days: picked }
    }

    if (value.kind === 'weekly_count') {
        return { kind: 'weekly_count', timesPerWeek: Math.min(7, Math.max(1, num(value.timesPerWeek, 3))) }
    }

    return { kind: 'daily' }
}

/** Six statuses became three. "At risk" is derived from pace now, not stored. */
function goalStatus(value: unknown): GoalStatus {
    if (value === 'achieved') return 'achieved'
    if (value === 'paused' || value === 'abandoned') return 'paused'
    return 'active'
}

export function normalize(raw: unknown): SecondBrainData {
    if (!isRecord(raw)) return emptyData()

    const habits: Habit[] = list(raw.habits)
        .filter(live)
        .map((h, index) => ({
            ...entity(h),
            name: text(h.name, 'Untitled habit'),
            icon: text(h.icon, 'target'),
            frequency: frequency(h.frequency),
            timeOfDay: timeOfDay(h.timeOfDay),
            sortOrder: num(h.sortOrder, index),
        }))

    const habitIds = new Set(habits.map(h => h.id))
    const seenEntries = new Set<string>()

    const habitEntries: HabitEntry[] = list(raw.habitEntries)
        // Older builds could store an explicit "not done" row.
        .filter(e => e.completed !== false)
        .map(e => ({ habitId: text(e.habitId), date: text(e.date) }))
        .filter(e => {
            const key = `${e.habitId}:${e.date}`
            if (!habitIds.has(e.habitId) || seenEntries.has(key)) return false
            seenEntries.add(key)
            return true
        })

    // A habit's start is never after its first logged day. Older builds stamped
    // `createdAt` when sample data was first saved, with history before it —
    // without this, that history would read as days before the habit existed.
    const firstLogged = new Map<string, string>()
    for (const entry of habitEntries) {
        const current = firstLogged.get(entry.habitId)
        if (current === undefined || entry.date < current) firstLogged.set(entry.habitId, entry.date)
    }
    for (const habit of habits) {
        const first = firstLogged.get(habit.id)
        const created = dayKey(habit.createdAt.slice(0, 10)) === null ? null : toDateKey(new Date(habit.createdAt))
        if (first && (created === null || first < created)) habit.createdAt = fromDateKey(first).toISOString()
    }

    const routines: Routine[] = list(raw.routines)
        .filter(live)
        .map((r, index) => ({
            ...entity(r),
            name: text(r.name, 'Untitled routine'),
            icon: text(r.icon, 'sunrise'),
            timeOfDay: timeOfDay(r.timeOfDay),
            days: days(r.days).length === 7 ? [] : days(r.days),
            sortOrder: num(r.sortOrder, index),
        }))

    const routineIds = new Set(routines.map(r => r.id))

    const routineSteps: RoutineStep[] = list(raw.routineSteps)
        .map((s, index) => ({
            ...entity(s),
            routineId: text(s.routineId),
            title: text(s.title),
            estimatedMinutes: typeof s.estimatedMinutes === 'number' ? s.estimatedMinutes : null,
            sortOrder: num(s.sortOrder, index),
        }))
        .filter(s => routineIds.has(s.routineId))

    const stepIds = new Set(routineSteps.map(s => s.id))

    const routineStepEntries: RoutineStepEntry[] = list(raw.routineStepEntries)
        .map(e => ({ stepId: text(e.stepId), date: text(e.date), completedAt: text(e.completedAt) }))
        .filter(e => stepIds.has(e.stepId))

    const goals: Goal[] = list(raw.goals)
        .filter(live)
        .map((g, index) => {
            const target = typeof g.target === 'number' && g.target > 0 ? g.target : null
            const startDate = dayKey(g.startDate) ?? todayKey()
            return {
                ...entity(g),
                title: text(g.title),
                why: text(g.why),
                status: goalStatus(g.status),
                startDate,
                targetDate: dayKey(g.targetDate) ?? daysAfter(startDate, 90),
                metric: target === null ? null : text(g.metric) || null,
                target,
                current: num(g.current, 0),
                sortOrder: num(g.sortOrder, index),
            }
        })

    const goalIds = new Set(goals.map(g => g.id))

    const milestones: Milestone[] = list(raw.milestones)
        .map((m, index) => ({
            ...entity(m),
            goalId: text(m.goalId),
            title: text(m.title),
            completedAt: typeof m.completedAt === 'string' ? m.completedAt : null,
            sortOrder: num(m.sortOrder, index),
        }))
        .filter(m => goalIds.has(m.goalId))

    return { habits, habitEntries, routines, routineSteps, routineStepEntries, goals, milestones }
}
