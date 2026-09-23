import { emptyData, type SecondBrainData } from '../domain/types'
import { toDateKey } from '../date'

/**
 * Sample data.
 *
 * Written as a plausible month in one person's life rather than "Habit 1 /
 * Goal A". Realistic content is what lets you judge density, truncation and
 * hierarchy — placeholder text hides every layout problem it should be exposing.
 *
 * Everything is relative to today so it never looks stale, and the habit history
 * is deterministic (a hash, not `Math.random`) so a reload doesn't reshuffle it
 * and make a real regression look like noise.
 */

/** `n` days before today, as a day key. Negative means the future. */
function daysAgo(n: number): string {
    const date = new Date()
    date.setDate(date.getDate() - n)
    return toDateKey(date)
}

/** Stable pseudo-random in [0,1) from a string. Same input, same history. */
function hash01(input: string): number {
    let h = 2166136261
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return ((h >>> 0) % 1000) / 1000
}

export function seedData(): SecondBrainData {
    // Local, so every call mints the same ids — the history is hashed from
    // `habitId:date`, and different ids would reshuffle it.
    let counter = 0
    const id = (prefix: string) => `${prefix}_seed_${++counter}`

    const data = emptyData()
    const stamp = new Date().toISOString()
    // Created two months ago, so the sixty days of history below are days the
    // habits actually existed rather than a backlog of misses.
    const created = new Date()
    created.setDate(created.getDate() - 60)
    const meta = { createdAt: created.toISOString(), updatedAt: stamp }

    // ─── Habits ──────────────────────────────────────────────────────────────
    const meditate = id('habit')
    const deepWork = id('habit')
    const gym = id('habit')
    const walk = id('habit')
    const read = id('habit')

    data.habits = [
        { ...meta, id: meditate, name: 'Meditate', icon: 'meditate', frequency: { kind: 'daily' }, timeOfDay: 'morning', sortOrder: 0 },
        { ...meta, id: deepWork, name: 'Deep work block', icon: 'code', frequency: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, timeOfDay: 'morning', sortOrder: 1 },
        { ...meta, id: gym, name: 'Gym', icon: 'dumbbell', frequency: { kind: 'weekly_count', timesPerWeek: 3 }, timeOfDay: 'afternoon', sortOrder: 2 },
        { ...meta, id: walk, name: 'Walk outside', icon: 'run', frequency: { kind: 'daily' }, timeOfDay: 'afternoon', sortOrder: 3 },
        { ...meta, id: read, name: 'Read 20 pages', icon: 'book', frequency: { kind: 'daily' }, timeOfDay: 'evening', sortOrder: 4 },
    ]

    // Sixty days of history, denser for the habits that are going well. Today is
    // left partly open so the first screen has something to do.
    const stickiness: Record<string, number> = {
        [meditate]: 0.82, [deepWork]: 0.88, [gym]: 0.5, [walk]: 0.64, [read]: 0.9,
    }
    const doneToday = new Set([meditate, deepWork])

    for (let i = 0; i < 60; i++) {
        const date = daysAgo(i)
        for (const habit of data.habits) {
            const done = i === 0
                ? doneToday.has(habit.id)
                : hash01(`${habit.id}:${date}`) < stickiness[habit.id]
            if (done) data.habitEntries.push({ habitId: habit.id, date })
        }
    }

    // ─── Routines ────────────────────────────────────────────────────────────
    const morning = id('routine')
    const shutdown = id('routine')

    data.routines = [
        { ...meta, id: morning, name: 'Morning start', icon: 'sunrise', timeOfDay: 'morning', days: [], sortOrder: 0 },
        { ...meta, id: shutdown, name: 'Shutdown', icon: 'moon', timeOfDay: 'evening', days: [1, 2, 3, 4, 5], sortOrder: 1 },
    ]

    const step = (routineId: string, title: string, estimatedMinutes: number | null, sortOrder: number) =>
        ({ ...meta, id: id('step'), routineId, title, estimatedMinutes, sortOrder })

    data.routineSteps = [
        step(morning, 'Glass of water before coffee', 1, 0),
        step(morning, 'Ten minutes of stretching', 10, 1),
        step(morning, 'Write the day’s three priorities', 5, 2),
        step(morning, 'Phone stays in the other room', null, 3),
        step(shutdown, 'Close open loops in the inbox', 10, 0),
        step(shutdown, 'Pick tomorrow’s first task', 3, 1),
        step(shutdown, 'Screens off', null, 2),
    ]

    // The morning routine opens part-done, rather than looking like a routine
    // nobody has ever run.
    for (const s of data.routineSteps.filter(s => s.routineId === morning).slice(0, 2)) {
        data.routineStepEntries.push({ stepId: s.id, date: daysAgo(0), completedAt: stamp })
    }

    // ─── Goals ───────────────────────────────────────────────────────────────
    const launch = id('goal')

    data.goals = [
        {
            ...meta, id: launch, sortOrder: 0,
            title: 'Launch Mentra 1.0',
            why: 'A tool I use every day, built well enough that other people would choose it too.',
            status: 'active', startDate: daysAgo(40), targetDate: daysAgo(-50),
            metric: null, target: null, current: 0,
        },
        {
            ...meta, id: id('goal'), sortOrder: 1,
            title: 'Read twelve books this year',
            why: 'Long-form reading is the first thing I drop when busy, and the first thing I miss.',
            status: 'active', startDate: daysAgo(266), targetDate: daysAgo(-99),
            metric: 'books', target: 12, current: 6,
        },
        {
            ...meta, id: id('goal'), sortOrder: 2,
            title: 'Bench bodyweight for five reps',
            why: 'A concrete number keeps training honest.',
            status: 'active', startDate: daysAgo(60), targetDate: daysAgo(-120),
            metric: 'kg', target: 72, current: 64,
        },
        {
            ...meta, id: id('goal'), sortOrder: 3,
            title: 'Run a 10K under 55 minutes',
            why: '',
            status: 'achieved', startDate: daysAgo(150), targetDate: daysAgo(20),
            metric: null, target: null, current: 0,
        },
    ]

    const milestone = (goalId: string, title: string, done: boolean, sortOrder: number) =>
        ({ ...meta, id: id('ms'), goalId, title, completedAt: done ? stamp : null, sortOrder })

    data.milestones = [
        milestone(launch, 'Settle the Second Brain scope', true, 0),
        milestone(launch, 'Design review of every screen', true, 1),
        milestone(launch, 'Private beta with twenty people', false, 2),
        milestone(launch, 'Public launch', false, 3),
    ]

    return data
}
