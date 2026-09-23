import { repository, createId } from './repo'
import { notifyWithUndo } from './feedback'
import { addDays, fromDateKey, toDateKey, todayKey } from './date'
import type {
    CollectionName, Goal, Habit, HabitFrequency, Milestone, Routine, RoutineStep,
    SecondBrainData, TimeOfDay,
} from './domain/types'

/**
 * Every mutation Second Brain makes, in one place.
 *
 * Each reads the store at the moment it runs rather than closing over a render's
 * snapshot, so two quick clicks can never act on stale data — and components stay
 * about presentation, with no business logic hiding in their handlers.
 *
 * Deletes never ask first. They happen at once and offer Undo, which restores the
 * exact prior arrays — order, history and all — rather than trying to re-insert.
 */

const now = () => new Date().toISOString()

function snapshot<K extends CollectionName>(...collections: K[]) {
    const data = repository.read()
    const saved = collections.map(name => [name, data[name]] as const)
    return () => {
        for (const [name, records] of saved) repository.replace(name, records as SecondBrainData[K])
    }
}

const nextOrder = (records: { sortOrder: number }[]) =>
    records.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1

// ─── Habits ──────────────────────────────────────────────────────────────────

export interface HabitDraft {
    name: string
    icon: string
    frequency: HabitFrequency
    timeOfDay: TimeOfDay
}

export function toggleHabit(habitId: string, date: string): void {
    const { habitEntries: entries, habits } = repository.read()
    const done = entries.some(e => e.habitId === habitId && e.date === date)

    repository.replace(
        'habitEntries',
        done
            ? entries.filter(e => !(e.habitId === habitId && e.date === date))
            : [...entries, { habitId, date }]
    )

    // Logging a day before the habit was created means it really started then.
    // Moving the start back keeps that day — and the ones after it — counting.
    const habit = habits.find(h => h.id === habitId)
    if (!done && habit && date < toDateKey(new Date(habit.createdAt))) {
        repository.update('habits', habitId, { createdAt: fromDateKey(date).toISOString() })
    }
}

/** Create when `id` is absent, otherwise update. Returns the habit's id. */
export function saveHabit(draft: HabitDraft, id?: string): string {
    const fields = { ...draft, name: draft.name.trim() }

    if (id) {
        repository.update('habits', id, fields)
        return id
    }

    const stamp = now()
    const habit: Habit = {
        id: createId('habit'), createdAt: stamp, updatedAt: stamp,
        ...fields, sortOrder: nextOrder(repository.read().habits),
    }
    repository.create('habits', habit)
    return habit.id
}

export function deleteHabit(habit: Habit): void {
    const undo = snapshot('habits', 'habitEntries')
    const data = repository.read()

    repository.replace('habits', data.habits.filter(h => h.id !== habit.id))
    repository.replace('habitEntries', data.habitEntries.filter(e => e.habitId !== habit.id))

    notifyWithUndo(`Deleted “${habit.name}”`, undo)
}

// ─── Routines ────────────────────────────────────────────────────────────────

export interface RoutineDraft {
    name: string
    icon: string
    timeOfDay: TimeOfDay
    days: number[]
}

export function saveRoutine(draft: RoutineDraft, id?: string): string {
    const fields = { ...draft, name: draft.name.trim(), days: draft.days.length === 7 ? [] : draft.days }

    if (id) {
        repository.update('routines', id, fields)
        return id
    }

    const stamp = now()
    const routine: Routine = {
        id: createId('routine'), createdAt: stamp, updatedAt: stamp,
        ...fields, sortOrder: nextOrder(repository.read().routines),
    }
    repository.create('routines', routine)
    return routine.id
}

export function deleteRoutine(routine: Routine): void {
    const undo = snapshot('routines', 'routineSteps', 'routineStepEntries')
    const data = repository.read()
    const stepIds = new Set(data.routineSteps.filter(s => s.routineId === routine.id).map(s => s.id))

    repository.replace('routines', data.routines.filter(r => r.id !== routine.id))
    repository.replace('routineSteps', data.routineSteps.filter(s => !stepIds.has(s.id)))
    repository.replace('routineStepEntries', data.routineStepEntries.filter(e => !stepIds.has(e.stepId)))

    notifyWithUndo(`Deleted “${routine.name}”`, undo)
}

export function toggleStep(stepId: string, date: string): void {
    const entries = repository.read().routineStepEntries
    const done = entries.some(e => e.stepId === stepId && e.date === date)

    repository.replace(
        'routineStepEntries',
        done
            ? entries.filter(e => !(e.stepId === stepId && e.date === date))
            : [...entries, { stepId, date, completedAt: now() }]
    )
}

/** Clear one routine's ticks for a day. Other days are untouched. */
export function resetRoutine(routineId: string, date: string): void {
    const data = repository.read()
    const ids = new Set(data.routineSteps.filter(s => s.routineId === routineId).map(s => s.id))

    repository.replace(
        'routineStepEntries',
        data.routineStepEntries.filter(e => !(ids.has(e.stepId) && e.date === date))
    )
}

export function addStep(routineId: string, title: string): void {
    const clean = title.trim()
    if (!clean) return

    const stamp = now()
    const siblings = repository.read().routineSteps.filter(s => s.routineId === routineId)
    const step: RoutineStep = {
        id: createId('step'), createdAt: stamp, updatedAt: stamp,
        routineId, title: clean, estimatedMinutes: null, sortOrder: nextOrder(siblings),
    }
    repository.create('routineSteps', step)
}

export function updateStep(stepId: string, patch: Partial<Pick<RoutineStep, 'title' | 'estimatedMinutes'>>): void {
    repository.update('routineSteps', stepId, patch)
}

export function deleteStep(step: RoutineStep): void {
    const undo = snapshot('routineSteps', 'routineStepEntries')
    const data = repository.read()

    repository.replace('routineSteps', data.routineSteps.filter(s => s.id !== step.id))
    repository.replace('routineStepEntries', data.routineStepEntries.filter(e => e.stepId !== step.id))

    notifyWithUndo(`Removed “${step.title || 'step'}”`, undo)
}

/** Persist a new order for one routine's steps. */
export function reorderSteps(orderedIds: string[]): void {
    const order = new Map(orderedIds.map((id, index) => [id, index]))
    repository.replace(
        'routineSteps',
        repository.read().routineSteps.map(step =>
            order.has(step.id) ? { ...step, sortOrder: order.get(step.id)! } : step
        )
    )
}

// ─── Goals ───────────────────────────────────────────────────────────────────

/** A blank goal, three months long, measured by milestones until told otherwise. */
export function createGoal(): string {
    const stamp = now()
    const today = todayKey()
    const goal: Goal = {
        id: createId('goal'), createdAt: stamp, updatedAt: stamp,
        title: '', why: '', status: 'active',
        startDate: today, targetDate: addDays(today, 90),
        metric: null, target: null, current: 0,
        sortOrder: nextOrder(repository.read().goals),
    }
    repository.create('goals', goal)
    return goal.id
}

export function updateGoal(goalId: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>): void {
    repository.update('goals', goalId, patch)
}

export function deleteGoal(goal: Goal, { quiet = false } = {}): void {
    const undo = snapshot('goals', 'milestones')
    const data = repository.read()

    repository.replace('goals', data.goals.filter(g => g.id !== goal.id))
    repository.replace('milestones', data.milestones.filter(m => m.goalId !== goal.id))

    // A goal abandoned before it was given a title was never really created —
    // no toast for tidying it away.
    if (!quiet) notifyWithUndo(`Deleted “${goal.title || 'Untitled goal'}”`, undo)
}

export function addMilestone(goalId: string, title: string): void {
    const clean = title.trim()
    if (!clean) return

    const stamp = now()
    const siblings = repository.read().milestones.filter(m => m.goalId === goalId)
    const milestone: Milestone = {
        id: createId('ms'), createdAt: stamp, updatedAt: stamp,
        goalId, title: clean, completedAt: null, sortOrder: nextOrder(siblings),
    }
    repository.create('milestones', milestone)
}

export function toggleMilestone(milestone: Milestone): void {
    repository.update('milestones', milestone.id, {
        completedAt: milestone.completedAt ? null : now(),
    })
}

export function renameMilestone(milestoneId: string, title: string): void {
    repository.update('milestones', milestoneId, { title })
}

export function deleteMilestone(milestone: Milestone): void {
    const undo = snapshot('milestones')
    repository.remove('milestones', milestone.id)
    notifyWithUndo(`Removed “${milestone.title || 'milestone'}”`, undo)
}
