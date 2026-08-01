'use client'

import { useCallback, useMemo } from 'react'
import { useSecondBrainData, useSecondBrainActions, createId } from './repo'
import { todayKey, weekdayOf } from './date'
import {
    buildEntryIndex, lookupFrom, isScheduledOn, isWeeklyCount,
} from './domain/selectors'
import type { Habit, DayKey, TimeOfDay } from './domain/types'

/**
 * Habit-shaped view over the repository.
 *
 * The grid, month heatmap and day panel were written against a simpler local
 * store before the domain layer existed. Rather than rewrite three working
 * components, this adapts the repository to the shape they already expect —
 * which keeps one source of truth without throwing away the UI work.
 *
 * Everything the components need, nothing they don't.
 */
export function useHabitsView() {
    const data = useSecondBrainData()
    const { create, replace, reset: resetStore } = useSecondBrainActions()

    const isDone = useMemo(
        () => lookupFrom(buildEntryIndex(data.habitEntries)),
        [data.habitEntries]
    )

    const habits = useMemo(
        () =>
            data.habits
                .filter(habit => habit.archivedAt === null)
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [data.habits]
    )

    const toggleHabit = useCallback(
        (habitId: string, date: DayKey) => {
            const exists = data.habitEntries.some(e => e.habitId === habitId && e.date === date)

            replace(
                'habitEntries',
                exists
                    ? data.habitEntries.filter(e => !(e.habitId === habitId && e.date === date))
                    : [...data.habitEntries, { habitId, date, completed: true, value: null }]
            )
        },
        [data.habitEntries, replace]
    )

    const addHabit = useCallback(
        (input: { name: string; icon: string; timeOfDay: TimeOfDay; scheduleDays: number[] }) => {
            const name = input.name.trim()
            if (!name) return

            const stamp = new Date().toISOString()

            create('habits', {
                id: createId('habit'),
                createdAt: stamp,
                updatedAt: stamp,
                archivedAt: null,
                name,
                icon: input.icon,
                areaId: null,
                // The dialog only offers "every day" or specific weekdays today;
                // weekly-count habits are created from the habit detail screen.
                frequency:
                    input.scheduleDays.length === 0
                        ? { kind: 'daily' }
                        : { kind: 'weekdays', days: input.scheduleDays },
                timeOfDay: input.timeOfDay,
                target: null,
                unit: null,
                sortOrder: data.habits.length,
            })
        },
        [create, data.habits.length]
    )

    /** Archive rather than destroy — history stays queryable. */
    const deleteHabit = useCallback(
        (habitId: string) => {
            replace(
                'habits',
                data.habits.map(habit =>
                    habit.id === habitId
                        ? { ...habit, archivedAt: new Date().toISOString() }
                        : habit
                )
            )
        },
        [data.habits, replace]
    )

    const habitsForDate = useCallback(
        (date: DayKey): Habit[] =>
            habits.filter(habit => isScheduledOn(habit, date) || isWeeklyCount(habit)),
        [habits]
    )

    const progressForDate = useCallback(
        (date: DayKey) => {
            const due = habits.filter(habit => isScheduledOn(habit, date))
            const bonus = habits.filter(h => isWeeklyCount(h) && isDone(h.id, date))
            const total = due.length + bonus.length
            const done = due.filter(habit => isDone(habit.id, date)).length + bonus.length

            return { done, total }
        },
        [habits, isDone]
    )

    return {
        // The repository is read synchronously, so there is no pending state to
        // model — but the flag is kept so the shell's loading branch survives a
        // future async implementation.
        hydrated: true,
        habits,
        isHabitDone: isDone,
        toggleHabit,
        addHabit,
        deleteHabit,
        habitsForDate,
        progressForDate,
        reset: resetStore,

        // The day panel's one-off items were a feature of the superseded store.
        // Day-scoped tasks live in Mentra's task system, so these are no-ops that
        // keep the component's contract without inventing a second task list.
        tasksForDate: useCallback(() => [] as never[], []),
        addTask: useCallback(() => {}, []),
        toggleTask: useCallback(() => {}, []),
        deleteTask: useCallback(() => {}, []),
    }
}

export type HabitsViewApi = ReturnType<typeof useHabitsView>
export { weekdayOf, todayKey }
