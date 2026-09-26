/**
 * The shape the task table works with.
 *
 * Only the fields the table reads are required. Callers pass whatever richer
 * task object they already have — it travels through untouched, so opening a
 * row hands the detail panel the complete task.
 */

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface TaskTableTag {
    id: string
    name: string
}

export interface TaskTableSection {
    id: string
    name: string
}

export interface TaskTableTask {
    id: string
    title: string
    completed: boolean
    priority: string | null
    dueDate: Date | string | null
    scheduledStart?: Date | string | null
    durationMinutes?: number | null
    projectId: string | null
    sectionId: string | null
    sortOrder: number
    createdAt: Date | string
    tags?: { tag: TaskTableTag }[]
    subtasks?: { id: string; completed: boolean }[]
}

/** Which columns can be shown or hidden. */
export type TaskColumnId = 'done' | 'title' | 'due' | 'priority' | 'section' | 'labels' | 'subtasks' | 'created'

export type GroupBy = 'section' | 'none'

/** What the table remembers per place it is used. */
export interface TaskTablePrefs {
    sort: { columnId: string; direction: 'asc' | 'desc' } | null
    hidden: TaskColumnId[]
    showCompleted: boolean
    groupBy: GroupBy
}
