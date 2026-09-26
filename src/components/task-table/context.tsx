'use client'

import { createContext, useContext } from 'react'
import type { UpdateTaskInput } from '@/lib/actions/tasks'
import type { TaskTableSection, TaskTableTag, TaskTableTask } from './types'

/**
 * What every cell needs from the table: the lookups (sections, labels) and the
 * ways to change a task.
 *
 * Handed down through context rather than props so the column definitions stay
 * static — a column set rebuilt on every render would re-render every row.
 */
export interface TaskTableContextValue {
    sections: TaskTableSection[]
    tags: TaskTableTag[]
    /** Show `fields` at once and save `payload`; rolls back and says so on failure. */
    update: (task: TaskTableTask, fields: Partial<TaskTableTask>, payload: Omit<UpdateTaskInput, 'id'>, what: string) => void
    toggle: (task: TaskTableTask) => void
    createTag: (name: string) => Promise<TaskTableTag | null>
}

export const TaskTableContext = createContext<TaskTableContextValue | null>(null)

export function useTaskTable(): TaskTableContextValue {
    const value = useContext(TaskTableContext)
    if (!value) throw new Error('Task table cells must be rendered inside <TaskTable>.')
    return value
}

/** A row still being created has no server id yet, so nothing on it can be edited. */
export const isDraft = (task: TaskTableTask) => task.id.startsWith('draft-')
