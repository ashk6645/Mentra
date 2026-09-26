import { format, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns'
import type { TaskPriority, TaskTableTask } from './types'

/**
 * Pure helpers for dates and priority in the task table, kept out of the
 * components so they can be tested on their own.
 */

export const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 }

export const priorityRank = (priority: string | null): number =>
    priority && priority in PRIORITY_RANK ? PRIORITY_RANK[priority as TaskPriority] : 0

const toDate = (value: Date | string | null | undefined): Date | null => (value ? new Date(value) : null)

/** The time of day a task is set for, as "HH:mm", or null when it has none. */
export function timeOf(task: Pick<TaskTableTask, 'dueDate' | 'scheduledStart'>): string | null {
    const start = toDate(task.scheduledStart)
    if (start) return format(start, 'HH:mm')
    const due = toDate(task.dueDate)
    return due && (due.getHours() !== 0 || due.getMinutes() !== 0) ? format(due, 'HH:mm') : null
}

/** "Today", "Tomorrow", "Yesterday", "Mon 29 Sep" — with the time when there is one. */
export function dueLabel(task: Pick<TaskTableTask, 'dueDate' | 'scheduledStart'>, now = new Date()): string | null {
    const due = toDate(task.dueDate)
    if (!due) return null

    const day = isToday(due) ? 'Today'
        : isTomorrow(due) ? 'Tomorrow'
            : isYesterday(due) ? 'Yesterday'
                : format(due, due.getFullYear() === now.getFullYear() ? 'EEE d MMM' : 'd MMM yyyy')

    if (!timeOf(task)) return day
    return `${day}, ${format(toDate(task.scheduledStart) ?? due, 'h:mm a')}`
}

/**
 * Is it late? A task with no time is due by the end of its day, so it only
 * becomes overdue once that day has passed — not at midnight when it starts.
 */
export function isOverdue(task: Pick<TaskTableTask, 'dueDate' | 'scheduledStart' | 'completed'>, now = new Date()): boolean {
    const due = toDate(task.dueDate)
    if (!due || task.completed) return false
    return timeOf(task) ? due < now : startOfDay(due) < startOfDay(now)
}

/**
 * The fields to save when a task moves to a new day.
 *
 * Keeps the time of day it already had, and its duration, so rescheduling from
 * the table never silently turns a 3pm task into an all-day one.
 */
export function dueDatePatch(
    task: Pick<TaskTableTask, 'dueDate' | 'scheduledStart' | 'durationMinutes'>,
    day: Date | null
): { dueDate: string | null; scheduledStart?: string | null; scheduledEnd?: string | null } {
    if (!day) return { dueDate: null, scheduledStart: null, scheduledEnd: null }

    const time = timeOf(task)
    if (!time) return { dueDate: startOfDay(day).toISOString() }

    const [hours, minutes] = time.split(':').map(Number)
    const start = new Date(day)
    start.setHours(hours, minutes, 0, 0)
    const end = new Date(start.getTime() + (task.durationMinutes || 30) * 60_000)

    return {
        dueDate: start.toISOString(),
        // Only tasks that were time-blocked keep a schedule.
        ...(task.scheduledStart ? { scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() } : {}),
    }
}
