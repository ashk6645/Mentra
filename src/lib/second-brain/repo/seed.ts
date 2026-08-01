import { emptyData, type SecondBrainData } from '../domain/types'
import { toDateKey, weekDays } from '../date'

/**
 * Demo data.
 *
 * Written as a plausible month in one person's life rather than "Task 1 / Project A".
 * Realistic content is what lets you judge density, truncation and hierarchy while
 * building — placeholder text hides every layout problem it should be exposing.
 *
 * Everything is generated relative to today so the demo never looks stale, and the
 * habit history is deterministic (a hash, not `Math.random`) so a reload doesn't
 * reshuffle the heatmap and make a real regression look like noise.
 */

const now = () => new Date().toISOString()

/** `n` days before today, as a day key. */
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

let counter = 0
const id = (prefix: string) => `${prefix}_seed_${++counter}`

export function seedData(): SecondBrainData {
    // Reset per build. The counter is module-level, so without this a second call
    // (reset(), or the corrupt-storage fallback) mints different ids — and since
    // the habit history is hashed from `habitId:date`, the whole heatmap would
    // shift. Seeding must be a pure function of nothing.
    counter = 0

    const data = emptyData()
    const stamp = now()
    const entity = <T extends object>(fields: T) => ({
        createdAt: stamp,
        updatedAt: stamp,
        ...fields,
    })

    // ─── Areas ───────────────────────────────────────────────────────────────
    const areaHealth = id('area')
    const areaCareer = id('area')
    const areaLearning = id('area')
    const areaFinance = id('area')

    data.areas = [
        entity({
            id: areaHealth, archivedAt: null, name: 'Health & Fitness', icon: 'heart',
            description: 'Training, sleep and everything that keeps the engine running.',
            standard: 'Train at least four times a week. Asleep before midnight.',
        }),
        entity({
            id: areaCareer, archivedAt: null, name: 'Career', icon: 'target',
            description: 'Engineering craft, interviewing, and the work itself.',
            standard: 'Ship something visible every week.',
        }),
        entity({
            id: areaLearning, archivedAt: null, name: 'Learning', icon: 'brain',
            description: 'Deliberate study — system design, algorithms, fundamentals.',
            standard: 'One focused study block on every weekday.',
        }),
        entity({
            id: areaFinance, archivedAt: null, name: 'Finance', icon: 'wallet',
            description: 'Spending, saving and the runway.',
            standard: 'Save 30% of income. Review subscriptions monthly.',
        }),
    ]

    // ─── Goals ───────────────────────────────────────────────────────────────
    const goalSystemDesign = id('goal')
    const goalStrength = id('goal')

    data.goals = [
        entity({
            id: goalSystemDesign, archivedAt: null,
            title: 'Master system design fundamentals',
            why: 'Senior interviews turn on design, and I keep hand-waving through caching and consistency. I want to reason about tradeoffs instead of reciting patterns.',
            horizon: 'quarterly', status: 'active', areaId: areaLearning,
            startDate: daysAgo(38), targetDate: daysAgo(-52),
            metric: 'focused sessions', target: 100, current: 41,
        }),
        entity({
            id: goalStrength, archivedAt: null,
            title: 'Bench bodyweight for five reps',
            why: 'A concrete number keeps me honest. Training without a target drifts into going through the motions.',
            horizon: 'annual', status: 'active', areaId: areaHealth,
            startDate: daysAgo(64), targetDate: daysAgo(-180),
            metric: 'kg', target: 72, current: 62.5,
        }),
        entity({
            id: id('goal'), archivedAt: null,
            title: 'Read twelve books this year',
            why: 'Long-form reading is the first thing I drop when busy, and the first thing I miss.',
            horizon: 'annual', status: 'at_risk', areaId: areaLearning,
            startDate: daysAgo(210), targetDate: daysAgo(-150),
            metric: 'books', target: 12, current: 4,
        }),
    ]

    data.milestones = [
        entity({ id: id('ms'), goalId: goalSystemDesign, title: 'Finish caching and CDN module', targetDate: daysAgo(-6), completedAt: stamp, sortOrder: 0 }),
        entity({ id: id('ms'), goalId: goalSystemDesign, title: 'Design a rate limiter end to end', targetDate: daysAgo(-14), completedAt: null, sortOrder: 1 }),
        entity({ id: id('ms'), goalId: goalSystemDesign, title: 'Mock interview: design a news feed', targetDate: daysAgo(-30), completedAt: null, sortOrder: 2 }),
        entity({ id: id('ms'), goalId: goalStrength, title: 'Bench 65kg × 5', targetDate: daysAgo(-40), completedAt: null, sortOrder: 0 }),
    ]

    // ─── Habits ──────────────────────────────────────────────────────────────
    const habitGym = id('habit')
    const habitCode = id('habit')
    const habitStudy = id('habit')
    const habitRead = id('habit')
    const habitWater = id('habit')

    data.habits = [
        entity({
            id: habitGym, archivedAt: null, name: 'Gym', icon: 'dumbbell', areaId: areaHealth,
            frequency: { kind: 'weekly_count' as const, timesPerWeek: 5 },
            timeOfDay: 'morning' as const, target: null, unit: null, sortOrder: 0,
        }),
        entity({
            id: habitCode, archivedAt: null, name: 'Deep work', icon: 'code', areaId: areaCareer,
            frequency: { kind: 'weekdays' as const, days: [1, 2, 3, 4, 5] },
            timeOfDay: 'morning' as const, target: 2, unit: 'hours', sortOrder: 1,
        }),
        entity({
            id: habitStudy, archivedAt: null, name: 'Study', icon: 'brain', areaId: areaLearning,
            frequency: { kind: 'weekdays' as const, days: [1, 2, 3, 4, 5] },
            timeOfDay: 'afternoon' as const, target: 1, unit: 'hours', sortOrder: 2,
        }),
        entity({
            id: habitWater, archivedAt: null, name: 'Water', icon: 'water', areaId: areaHealth,
            frequency: { kind: 'daily' as const },
            timeOfDay: 'afternoon' as const, target: 3, unit: 'litres', sortOrder: 3,
        }),
        entity({
            id: habitRead, archivedAt: null, name: 'Read', icon: 'book', areaId: areaLearning,
            frequency: { kind: 'daily' as const },
            timeOfDay: 'evening' as const, target: 30, unit: 'minutes', sortOrder: 4,
        }),
    ]

    // 60 days of deterministic history, denser for the habits that are going well.
    const stickiness: Record<string, number> = {
        [habitGym]: 0.72, [habitCode]: 0.84, [habitStudy]: 0.66,
        [habitWater]: 0.58, [habitRead]: 0.88,
    }

    for (let i = 0; i < 60; i++) {
        const date = daysAgo(i)
        for (const habit of data.habits) {
            if (hash01(`${habit.id}:${date}`) > 1 - stickiness[habit.id]) {
                data.habitEntries.push({
                    habitId: habit.id,
                    date,
                    completed: true,
                    value: habit.target,
                })
            }
        }
    }

    // ─── Routines ────────────────────────────────────────────────────────────
    const routineMorning = id('routine')
    const routineShutdown = id('routine')

    data.routines = [
        entity({ id: routineMorning, archivedAt: null, name: 'Morning', icon: 'sunrise', timeOfDay: 'morning' as const, days: [], sortOrder: 0 }),
        entity({ id: routineShutdown, archivedAt: null, name: 'Shutdown', icon: 'moon', timeOfDay: 'evening' as const, days: [1, 2, 3, 4, 5], sortOrder: 1 }),
    ]

    data.routineSteps = [
        entity({ id: id('step'), routineId: routineMorning, title: 'Water before coffee', estimatedMinutes: 1, sortOrder: 0 }),
        entity({ id: id('step'), routineId: routineMorning, title: 'Shower', estimatedMinutes: 10, sortOrder: 1 }),
        entity({ id: id('step'), routineId: routineMorning, title: 'Review today’s three priorities', estimatedMinutes: 5, sortOrder: 2 }),
        entity({ id: id('step'), routineId: routineMorning, title: 'Phone stays in the other room', estimatedMinutes: null, sortOrder: 3 }),
        entity({ id: id('step'), routineId: routineShutdown, title: 'Close open branches and PRs', estimatedMinutes: 10, sortOrder: 0 }),
        entity({ id: id('step'), routineId: routineShutdown, title: 'Write tomorrow’s top priority', estimatedMinutes: 3, sortOrder: 1 }),
        entity({ id: id('step'), routineId: routineShutdown, title: 'Screens off', estimatedMinutes: null, sortOrder: 2 }),
    ]

    // Today's morning routine, partly done — so the demo opens mid-progress
    // rather than showing a routine nobody has ever run.
    const morningSteps = data.routineSteps.filter(step => step.routineId === routineMorning)
    for (const step of morningSteps.slice(0, 2)) {
        data.routineStepEntries.push({
            stepId: step.id,
            date: daysAgo(0),
            completedAt: stamp,
        })
    }

    // ─── Fitness ─────────────────────────────────────────────────────────────
    const exBench = id('ex'), exInclineDb = id('ex'), exOhp = id('ex'), exLatRaise = id('ex'), exPushdown = id('ex')
    const exRow = id('ex'), exPullup = id('ex'), exCurl = id('ex')
    const exSquat = id('ex'), exRdl = id('ex'), exLegPress = id('ex')

    data.exercises = [
        entity({ id: exBench, archivedAt: null, name: 'Barbell bench press', muscleGroup: 'chest' as const, equipment: 'Barbell', tracksWeight: true }),
        entity({ id: exInclineDb, archivedAt: null, name: 'Incline dumbbell press', muscleGroup: 'chest' as const, equipment: 'Dumbbell', tracksWeight: true }),
        entity({ id: exOhp, archivedAt: null, name: 'Overhead press', muscleGroup: 'shoulders' as const, equipment: 'Barbell', tracksWeight: true }),
        entity({ id: exLatRaise, archivedAt: null, name: 'Lateral raise', muscleGroup: 'shoulders' as const, equipment: 'Dumbbell', tracksWeight: true }),
        entity({ id: exPushdown, archivedAt: null, name: 'Triceps pushdown', muscleGroup: 'triceps' as const, equipment: 'Cable', tracksWeight: true }),
        entity({ id: exRow, archivedAt: null, name: 'Barbell row', muscleGroup: 'back' as const, equipment: 'Barbell', tracksWeight: true }),
        entity({ id: exPullup, archivedAt: null, name: 'Pull-up', muscleGroup: 'back' as const, equipment: 'Bodyweight', tracksWeight: true }),
        entity({ id: exCurl, archivedAt: null, name: 'Dumbbell curl', muscleGroup: 'biceps' as const, equipment: 'Dumbbell', tracksWeight: true }),
        entity({ id: exSquat, archivedAt: null, name: 'Back squat', muscleGroup: 'legs' as const, equipment: 'Barbell', tracksWeight: true }),
        entity({ id: exRdl, archivedAt: null, name: 'Romanian deadlift', muscleGroup: 'legs' as const, equipment: 'Barbell', tracksWeight: true }),
        entity({ id: exLegPress, archivedAt: null, name: 'Leg press', muscleGroup: 'legs' as const, equipment: 'Machine', tracksWeight: true }),
    ]

    const tplPush = id('tpl'), tplPull = id('tpl'), tplLegs = id('tpl')

    data.workoutTemplates = [
        entity({ id: tplPush, archivedAt: null, name: 'Push — chest, shoulders, triceps', program: 'Push / Pull / Legs', notes: '', sortOrder: 0 }),
        entity({ id: tplPull, archivedAt: null, name: 'Pull — back and biceps', program: 'Push / Pull / Legs', notes: '', sortOrder: 1 }),
        entity({ id: tplLegs, archivedAt: null, name: 'Legs', program: 'Push / Pull / Legs', notes: '', sortOrder: 2 }),
    ]

    const tplEx = (templateId: string, exerciseId: string, sets: number, reps: string, order: number) =>
        entity({ id: id('tex'), templateId, exerciseId, targetSets: sets, targetReps: reps, sortOrder: order })

    data.templateExercises = [
        tplEx(tplPush, exBench, 4, '5-8', 0),
        tplEx(tplPush, exInclineDb, 3, '8-12', 1),
        tplEx(tplPush, exOhp, 3, '6-10', 2),
        tplEx(tplPush, exLatRaise, 3, '12-15', 3),
        tplEx(tplPush, exPushdown, 3, '10-15', 4),
        tplEx(tplPull, exPullup, 4, '5-10', 0),
        tplEx(tplPull, exRow, 4, '6-10', 1),
        tplEx(tplPull, exCurl, 3, '10-12', 2),
        tplEx(tplLegs, exSquat, 4, '5-8', 0),
        tplEx(tplLegs, exRdl, 3, '8-10', 1),
        tplEx(tplLegs, exLegPress, 3, '10-15', 2),
    ]

    // Six past sessions with a gentle upward trend, so the exercise charts
    // actually show progression rather than a flat line.
    const pastSessions: { dayOffset: number; templateId: string; name: string; lifts: [string, number, number][] }[] = [
        { dayOffset: 2, templateId: tplPush, name: 'Push — chest, shoulders, triceps', lifts: [[exBench, 62.5, 6], [exInclineDb, 26, 10], [exOhp, 40, 8]] },
        { dayOffset: 4, templateId: tplPull, name: 'Pull — back and biceps', lifts: [[exRow, 60, 8], [exCurl, 14, 11]] },
        { dayOffset: 6, templateId: tplLegs, name: 'Legs', lifts: [[exSquat, 85, 6], [exRdl, 70, 9]] },
        { dayOffset: 9, templateId: tplPush, name: 'Push — chest, shoulders, triceps', lifts: [[exBench, 60, 7], [exInclineDb, 24, 11], [exOhp, 40, 7]] },
        { dayOffset: 11, templateId: tplPull, name: 'Pull — back and biceps', lifts: [[exRow, 57.5, 9], [exCurl, 14, 10]] },
        { dayOffset: 13, templateId: tplLegs, name: 'Legs', lifts: [[exSquat, 82.5, 6], [exRdl, 67.5, 8]] },
    ]

    for (const session of pastSessions) {
        const workoutId = id('workout')
        const start = new Date()
        start.setDate(start.getDate() - session.dayOffset)
        start.setHours(7, 30, 0, 0)
        const end = new Date(start.getTime() + 68 * 60 * 1000)

        data.workouts.push(entity({
            id: workoutId, templateId: session.templateId, name: session.name,
            startedAt: start.toISOString(), finishedAt: end.toISOString(),
            notes: '', rating: 4,
        }))

        session.lifts.forEach(([exerciseId, weight, reps], exerciseIndex) => {
            for (let setNumber = 1; setNumber <= 3; setNumber++) {
                data.workoutSets.push(entity({
                    id: id('set'), workoutId, exerciseId, setNumber,
                    // Slight drop-off across sets, as actually happens.
                    weight: weight - (setNumber - 1) * 2.5,
                    reps: Math.max(4, reps - (setNumber - 1)),
                    durationSeconds: null,
                    completedAt: new Date(start.getTime() + (exerciseIndex * 12 + setNumber * 3) * 60 * 1000).toISOString(),
                }))
            }
        })
    }

    // ─── Learning ────────────────────────────────────────────────────────────
    const learnCaching = id('learn'), learnConsistency = id('learn'), learnDsa = id('learn')

    data.learningItems = [
        entity({
            id: learnCaching, archivedAt: null, title: 'Caching strategies', category: 'System design',
            status: 'practicing' as const, areaId: areaLearning, goalId: goalSystemDesign,
            progress: 70, confidence: 4, lastReviewedAt: daysAgo(3), nextReviewAt: daysAgo(-4), reviewCount: 5,
        }),
        entity({
            id: learnConsistency, archivedAt: null, title: 'Consistency and consensus', category: 'System design',
            status: 'learning' as const, areaId: areaLearning, goalId: goalSystemDesign,
            progress: 30, confidence: 2, lastReviewedAt: daysAgo(9), nextReviewAt: daysAgo(1), reviewCount: 2,
        }),
        entity({
            id: learnDsa, archivedAt: null, title: 'Graph algorithms', category: 'DSA',
            status: 'reviewing' as const, areaId: areaLearning, goalId: null,
            progress: 85, confidence: 4, lastReviewedAt: daysAgo(1), nextReviewAt: daysAgo(-9), reviewCount: 11,
        }),
    ]

    const sessions: [string, number, number, string][] = [
        [learnCaching, 1, 75, 'Write-through vs write-back, and when a cache stampede actually bites.'],
        [learnCaching, 4, 60, 'Cache invalidation strategies. TTL is a blunt instrument.'],
        [learnConsistency, 2, 90, 'Read Raft paper section 5. Leader election finally clicked.'],
        [learnDsa, 1, 45, 'Dijkstra vs A*. Implemented both on the same grid.'],
        [learnDsa, 5, 50, 'Union-find with path compression.'],
        [learnCaching, 8, 40, 'Redis eviction policies — allkeys-lru vs volatile-lru.'],
    ]

    data.studySessions = sessions.map(([learningItemId, dayOffset, minutes, summary]) =>
        entity({ id: id('study'), learningItemId, date: daysAgo(dayOffset), minutes, summary, confidence: 4 })
    )

    // ─── Knowledge inputs ────────────────────────────────────────────────────
    data.resources = [
        entity({ id: id('res'), archivedAt: null, title: 'Designing Data-Intensive Applications — Ch. 5', url: 'https://dataintensive.net', type: 'documentation' as const, status: 'consuming' as const, areaId: areaLearning, notes: 'Replication chapter. Dense but worth it.', rating: 5 }),
        entity({ id: id('res'), archivedAt: null, title: 'Redis eviction policies', url: 'https://redis.io/docs/latest/develop/reference/eviction/', type: 'documentation' as const, status: 'reference' as const, areaId: areaLearning, notes: '', rating: 4 }),
        entity({ id: id('res'), archivedAt: null, title: 'The Raft consensus algorithm', url: 'https://raft.github.io', type: 'article' as const, status: 'finished' as const, areaId: areaLearning, notes: 'The visualisation is the reason it clicked.', rating: 5 }),
        entity({ id: id('res'), archivedAt: null, title: 'System Design Interview — Alex Xu', url: '', type: 'course' as const, status: 'to_consume' as const, areaId: areaCareer, notes: '', rating: null }),
    ]

    data.mediaItems = [
        entity({ id: id('media'), archivedAt: null, title: 'Deep Work', type: 'book' as const, status: 'in_progress' as const, creator: 'Cal Newport', progress: 60, startedAt: daysAgo(21), finishedAt: null, rating: null, keyIdeas: 'Attention residue is the real cost of context switching.' }),
        entity({ id: id('media'), archivedAt: null, title: 'The Pragmatic Programmer', type: 'book' as const, status: 'completed' as const, creator: 'Hunt & Thomas', progress: 100, startedAt: daysAgo(70), finishedAt: daysAgo(32), rating: 4, keyIdeas: 'Tracer bullets over big-bang delivery.' }),
        entity({ id: id('media'), archivedAt: null, title: 'Andor', type: 'series' as const, status: 'in_progress' as const, creator: 'Tony Gilroy', progress: null, startedAt: daysAgo(12), finishedAt: null, rating: null, keyIdeas: '' }),
    ]

    data.ideas = [
        entity({ id: id('idea'), archivedAt: null, title: 'CLI that summarises a repo’s architecture', description: 'Point it at a repo, get a one-page map of the modules and how they depend on each other.', areaId: areaCareer, status: 'promising' as const, potential: 4, effort: 3 }),
        entity({ id: id('idea'), archivedAt: null, title: 'Spaced repetition on my own notes', description: 'Surface a note I wrote three months ago, at the moment I’m about to forget it.', areaId: areaLearning, status: 'exploring' as const, potential: 5, effort: 4 }),
        entity({ id: id('idea'), archivedAt: null, title: 'Weekly review that writes its own first draft', description: 'Pull the week’s data and pre-fill the review so I only edit.', areaId: areaCareer, status: 'raw' as const, potential: 3, effort: 2 }),
    ]

    // ─── Reflection ──────────────────────────────────────────────────────────
    const journals: [number, number, number, string, string, number][] = [
        [1, 4, 4, 'Finally understood leader election properly.', 'Two clean hours before anyone was awake.', 8],
        [2, 3, 3, 'Shipped the rate limiter fix.', 'Too much time in the inbox.', 6],
        [4, 5, 4, 'Bench moved to 62.5.', 'Slept eight hours for once.', 9],
    ]

    data.journalEntries = journals.map(([dayOffset, mood, energy, biggestWin, wentWell, dayRating]) =>
        entity({
            id: id('journal'), date: daysAgo(dayOffset), mood, energy,
            intention: '', biggestWin, wentWell,
            couldImprove: '', learned: '', gratitude: '', tomorrowPriority: '',
            dayRating, freeform: '',
        })
    )

    // Last week's review, completed — so the reviews page opens with history
    // instead of an empty state on a feature that is about looking back.
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    data.reviews = [
        entity({
            id: id('review'), kind: 'weekly' as const,
            periodStart: weekDays(lastWeek)[0],
            wins: 'Shipped the rate limiter fix and finally understood leader election.',
            worked: 'Two-hour blocks before anyone was awake. Nothing else came close.',
            didntWork: 'Afternoon study kept getting eaten by meetings.',
            learned: 'Cache invalidation is a design problem, not a TTL problem.',
            stop: 'Opening the inbox before the first deep-work block.',
            continueDoing: 'Early sessions. Writing the day’s three priorities the night before.',
            start: 'Moving study to the morning on meeting-heavy days.',
            nextPriorities: 'Design a rate limiter end to end\nBench 65×5\nFinish DDIA chapter 5',
            completedAt: stamp,
        }),
    ]

    // ─── Finance ─────────────────────────────────────────────────────────────
    const txns: [('income' | 'expense'), number, string, number, string][] = [
        ['income', 320000, 'salary', 28, 'Monthly salary'],
        ['expense', 45000, 'housing', 27, 'Rent'],
        ['expense', 8400, 'food', 3, 'Groceries'],
        ['expense', 2200, 'fitness', 26, 'Gym membership'],
        ['expense', 1499, 'subscriptions', 20, 'Cloud storage'],
        ['expense', 6500, 'technology', 14, 'Mechanical keyboard'],
        ['expense', 3200, 'education', 9, 'Course renewal'],
        ['expense', 1800, 'transport', 5, 'Fuel'],
        ['expense', 2400, 'food', 11, 'Dinner out'],
    ]

    data.transactions = txns.map(([kind, amountMinor, category, dayOffset, description]) =>
        entity({
            id: id('txn'), kind, amountMinor,
            category: category as SecondBrainData['transactions'][number]['category'],
            date: daysAgo(dayOffset), description,
        })
    )

    return data
}
