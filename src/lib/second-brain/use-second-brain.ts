'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
    type SecondBrainState,
    type Habit,
    type DayTask,
    type TimeOfDay,
    entryKey,
} from './types'
import { loadState, saveState, resetState, createId } from './storage'
import { weekdayOf } from './date'

/**
 * Reactive wrapper around the persisted state.
 *
 * Implemented as an external store rather than `useState` + `useEffect`. Reading
 * localStorage into state from an effect causes a cascading render on every mount —
 * which the React Compiler (enabled in next.config.ts) correctly flags — and forces
 * a manual guard so the first write doesn't clobber what was just read.
 * `useSyncExternalStore` handles the server/client snapshot split natively, so the
 * shell renders on the server and real data swaps in after hydration with no mismatch.
 */

let cache: SecondBrainState | null = null
const listeners = new Set<() => void>()

function emit() {
    for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener)

    // Keep two open tabs in agreement. Without this, ticking a habit in one tab
    // leaves the other showing stale data until reload.
    const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key.startsWith('mentra.second-brain')) {
            cache = loadState()
            emit()
        }
    }

    window.addEventListener('storage', onStorage)

    return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
    }
}

/**
 * Must return a referentially stable value while nothing has changed, or
 * useSyncExternalStore loops. The module-level cache guarantees that.
 */
function getSnapshot(): SecondBrainState | null {
    if (cache === null) cache = loadState()
    return cache
}

/** null on the server, so the first paint is the neutral shell. */
function getServerSnapshot(): SecondBrainState | null {
    return null
}

/** Apply a pure transition, persist it, notify subscribers. */
function mutate(transition: (state: SecondBrainState) => SecondBrainState): void {
    const current = getSnapshot()
    if (!current) return

    cache = transition(current)
    saveState(cache)
    emit()
}

export function useSecondBrain() {
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

    /**
     * Completed entries as a Set of `habitId:date`.
     *
     * Rebuilt only when state changes. Without it every habit row would scan the
     * whole entry list on each render — O(habits x entries) for a single day.
     */
    const completedSet = useMemo(() => {
        const set = new Set<string>()
        if (!state) return set

        for (const entry of state.entries) {
            if (entry.completed) set.add(entryKey(entry.habitId, entry.date))
        }
        return set
    }, [state])

    const isHabitDone = useCallback(
        (habitId: string, date: string) => completedSet.has(entryKey(habitId, date)),
        [completedSet]
    )

    const toggleHabit = useCallback((habitId: string, date: string) => {
        mutate(prev => {
            const index = prev.entries.findIndex(e => e.habitId === habitId && e.date === date)

            // No row yet — first completion for this habit on this day.
            if (index === -1) {
                return { ...prev, entries: [...prev.entries, { habitId, date, completed: true }] }
            }

            // Un-ticking removes the row rather than storing `completed: false`.
            // Absence already means "not done", and it stops storage growing a row
            // for every habit on every day the user merely looked at.
            if (prev.entries[index].completed) {
                return { ...prev, entries: prev.entries.filter((_, i) => i !== index) }
            }

            const entries = [...prev.entries]
            entries[index] = { ...entries[index], completed: true }
            return { ...prev, entries }
        })
    }, [])

    const addHabit = useCallback(
        (input: { name: string; icon: string; timeOfDay: TimeOfDay; scheduleDays: number[] }) => {
            const name = input.name.trim()
            if (!name) return

            mutate(prev => {
                const habit: Habit = {
                    id: createId('habit'),
                    name,
                    icon: input.icon || '✅',
                    timeOfDay: input.timeOfDay,
                    scheduleDays: input.scheduleDays,
                    createdAt: new Date().toISOString(),
                }

                return { ...prev, habits: [...prev.habits, habit] }
            })
        },
        []
    )

    const deleteHabit = useCallback((habitId: string) => {
        mutate(prev => ({
            ...prev,
            habits: prev.habits.filter(h => h.id !== habitId),
            // Drop its history too, so a habit re-created with the same name never
            // inherits stale ticks.
            entries: prev.entries.filter(e => e.habitId !== habitId),
        }))
    }, [])

    const addTask = useCallback((title: string, date: string, timeOfDay: TimeOfDay) => {
        const trimmed = title.trim()
        if (!trimmed) return

        mutate(prev => {
            const task: DayTask = {
                id: createId('task'),
                title: trimmed,
                date,
                timeOfDay,
                completed: false,
                createdAt: new Date().toISOString(),
            }

            return { ...prev, tasks: [...prev.tasks, task] }
        })
    }, [])

    const toggleTask = useCallback((taskId: string) => {
        mutate(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        }))
    }, [])

    const deleteTask = useCallback((taskId: string) => {
        mutate(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }))
    }, [])

    const reset = useCallback(() => {
        cache = resetState()
        emit()
    }, [])

    /** Habits expected on a given day. */
    const habitsForDate = useCallback(
        (date: string): Habit[] => {
            if (!state) return []

            const weekday = weekdayOf(date)

            // Empty scheduleDays means "every day" — easier to author than listing
            // all seven, and it reads correctly in the habit editor.
            return state.habits.filter(
                h => h.scheduleDays.length === 0 || h.scheduleDays.includes(weekday)
            )
        },
        [state]
    )

    /** One-off items belonging to a given day. */
    const tasksForDate = useCallback(
        (date: string): DayTask[] => (state ? state.tasks.filter(t => t.date === date) : []),
        [state]
    )

    /** Completed / total for a day, counting habits and one-off items together. */
    const progressForDate = useCallback(
        (date: string): { done: number; total: number } => {
            if (!state) return { done: 0, total: 0 }

            const habits = habitsForDate(date)
            const tasks = tasksForDate(date)

            const done =
                habits.filter(h => completedSet.has(entryKey(h.id, date))).length +
                tasks.filter(t => t.completed).length

            return { done, total: habits.length + tasks.length }
        },
        [state, habitsForDate, tasksForDate, completedSet]
    )

    return {
        /** False until localStorage has been read; render a shell while false. */
        hydrated: state !== null,
        habits: state?.habits ?? [],
        isHabitDone,
        toggleHabit,
        addHabit,
        deleteHabit,
        addTask,
        toggleTask,
        deleteTask,
        habitsForDate,
        tasksForDate,
        progressForDate,
        reset,
    }
}

export type SecondBrainApi = ReturnType<typeof useSecondBrain>
