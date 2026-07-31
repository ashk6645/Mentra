import type { SecondBrainState, Habit, DayTask, TimeOfDay } from './types'

/**
 * Persistence for Second Brain.
 *
 * This is the *only* module that knows where the data lives. Components receive
 * state as props and call mutators; nothing else touches localStorage. Swapping in
 * server actions later means rewriting this file and leaving the UI untouched.
 *
 * Versioned key: if the shape changes, bump the suffix rather than trying to migrate
 * a demo's data.
 */
const STORAGE_KEY = 'mentra.second-brain.v1'

/** Seed routine, written once on first load so the page is never an empty shell. */
function seedState(): SecondBrainState {
    const now = new Date().toISOString()

    const habit = (
        id: string,
        name: string,
        icon: string,
        timeOfDay: TimeOfDay,
        scheduleDays: number[]
    ): Habit => ({ id, name, icon, timeOfDay, scheduleDays, createdAt: now })

    return {
        habits: [
            // Mon-Sat, rest on Sunday
            habit('h-gym', 'Gym', 'dumbbell', 'morning', [1, 2, 3, 4, 5, 6]),
            habit('h-read', 'Read 20 pages', 'book', 'morning', []),
            habit('h-study', 'Study', 'brain', 'afternoon', [1, 2, 3, 4, 5]),
            habit('h-deep', 'Deep work block', 'target', 'afternoon', [1, 2, 3, 4, 5]),
            habit('h-review', 'Review the day', 'moon', 'evening', []),
        ],
        entries: [],
        tasks: [],
    }
}

const emptyState = (): SecondBrainState => ({ habits: [], entries: [], tasks: [] })

/**
 * Read persisted state.
 *
 * Returns null on the server — callers must treat that as "not hydrated yet" and
 * render a neutral shell, otherwise React reports a hydration mismatch when the
 * client fills in real data.
 */
export function loadState(): SecondBrainState | null {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            const seeded = seedState()
            saveState(seeded)
            return seeded
        }

        const parsed = JSON.parse(raw) as Partial<SecondBrainState>

        // Defensive: hand-edited or half-written storage must not crash the page.
        return {
            habits: Array.isArray(parsed.habits) ? parsed.habits : [],
            entries: Array.isArray(parsed.entries) ? parsed.entries : [],
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        }
    } catch {
        // Corrupt JSON, or storage blocked (private mode, disabled cookies).
        // Degrade to an in-memory session rather than breaking the route.
        return emptyState()
    }
}

/** Persist state. Silently no-ops when storage is unavailable. */
export function saveState(state: SecondBrainState): void {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Quota exceeded or storage blocked — the session still works, it just
        // won't survive a reload. Not worth interrupting the user over.
    }
}

/** Wipe everything and re-seed. Used by the "Reset demo" action. */
export function resetState(): SecondBrainState {
    const seeded = seedState()
    saveState(seeded)
    return seeded
}

/**
 * Collision-resistant id without pulling in a dependency.
 * `crypto.randomUUID` where available, timestamp+random otherwise.
 */
export function createId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}-${crypto.randomUUID()}`
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export type { Habit, DayTask }
