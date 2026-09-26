'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createTask, deleteTask, toggleTaskCompletion, updateTask, updateTaskOrder } from '@/lib/actions/tasks'
import { createTag as createTagAction, getTags } from '@/lib/actions/tags'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { isDraft, type TaskTableContextValue } from './context'
import { useOptimisticTasks } from './use-optimistic-tasks'
import type { TaskPriority, TaskTableSection, TaskTableTag, TaskTableTask } from './types'

/** What a new task starts with, beyond its title. */
export interface NewTask {
    title: string
    sectionId: string | null
    dueDate?: Date
    priority?: TaskPriority
    tags?: TaskTableTag[]
    recurrence?: { interval: 'daily' | 'weekly' | 'monthly' | 'yearly'; step?: number; days?: number[] }
}

/** One task's place after a drag: its section and position within it. */
export interface Placement {
    id: string
    sectionId: string | null
    sortOrder: number
}

/**
 * Every way the task views change tasks, in one place.
 *
 * The table and the list are two layouts over the same data, so they share this
 * rather than each keeping its own copy: an edit, a completion or a drag behaves
 * identically in both. Every change shows at once (see `useOptimisticTasks`),
 * saves through the app's server actions, and rolls back with a message if the
 * save fails.
 */
export function useTaskActions<T extends TaskTableTask>({
    tasks,
    sections,
    projectId,
    project,
}: {
    tasks: T[]
    sections: TaskTableSection[]
    projectId: string | null
    project: { id: string; name: string; icon: string | null; color: string } | null
}) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const [tags, setTags] = useState<TaskTableTag[]>([])
    const { rows, begin, settle, fail, addDraft, resolveDraft, dropDraft, hide, restore } = useOptimisticTasks(tasks)

    useEffect(() => {
        let live = true
        getTags().then(result => {
            if (live) setTags(result.map(tag => ({ id: tag.id, name: tag.name })))
        })
        return () => {
            live = false
        }
    }, [])

    /** Keep an open detail panel in step with edits made here. */
    const syncPanel = useCallback((id: string, fields: object) => {
        const { selectedTask, selectTask } = useTaskDetailStore.getState()
        if (selectedTask?.id === id) selectTask(id, { ...selectedTask, ...fields })
    }, [])

    const update = useCallback<TaskTableContextValue['update']>((task, fields, payload, what) => {
        begin(task.id, fields as Partial<T>)
        startTransition(async () => {
            const result = await updateTask({ id: task.id, ...payload })
            if (!result.success) {
                fail(task.id)
                toast.error(`Couldn’t update ${what}`, { description: result.error })
                return
            }
            settle(task.id)
            syncPanel(task.id, fields)
            router.refresh()
        })
    }, [begin, fail, settle, syncPanel, router])

    /** Completing goes through the completion path, so repeating tasks roll over. */
    const toggle = useCallback<TaskTableContextValue['toggle']>(task => {
        const completed = !task.completed
        begin(task.id, { completed } as Partial<T>)
        startTransition(async () => {
            const result = await toggleTaskCompletion(task.id, completed)
            if (!result.success) {
                fail(task.id)
                toast.error('Couldn’t update the task', { description: result.error })
                return
            }
            settle(task.id)
            syncPanel(task.id, { completed })
            router.refresh()
        })
    }, [begin, fail, settle, syncPanel, router])

    const createTag = useCallback<TaskTableContextValue['createTag']>(async name => {
        const result = await createTagAction({ name, color: 'bg-slate-500' })
        if (!result.success || !result.data) {
            toast.error('Couldn’t create the label')
            return null
        }
        const tag = { id: result.data.id, name: result.data.name }
        setTags(previous => [...previous, tag])
        return tag
    }, [])

    const add = useCallback((draft: NewTask) => {
        const tempId = `draft-${crypto.randomUUID()}`
        addDraft(tempId, {
            id: tempId,
            title: draft.title,
            completed: false,
            priority: draft.priority ?? null,
            dueDate: draft.dueDate?.toISOString() ?? null,
            projectId,
            sectionId: draft.sectionId,
            sortOrder: Number.MAX_SAFE_INTEGER,
            createdAt: new Date().toISOString(),
            tags: (draft.tags ?? []).map(tag => ({ tag })),
            subtasks: [],
        } as unknown as T)

        startTransition(async () => {
            const result = await createTask({
                title: draft.title,
                projectId,
                sectionId: draft.sectionId,
                dueDate: draft.dueDate?.toISOString(),
                priority: draft.priority,
                tagIds: draft.tags?.map(tag => tag.id),
                ...(draft.recurrence && {
                    isRecurring: true,
                    recurrenceInterval: draft.recurrence.interval,
                    recurrenceStep: draft.recurrence.step,
                    recurrenceDays: draft.recurrence.days,
                }),
            })
            if (!result.success || !result.data) {
                dropDraft(tempId)
                toast.error('Couldn’t add the task', { description: result.success ? undefined : result.error })
                return
            }
            resolveDraft(tempId, result.data.id)
            router.refresh()
        })
    }, [addDraft, dropDraft, resolveDraft, projectId, router])

    /** Delete at once; put it back if the server refuses. */
    const remove = useCallback((task: T) => {
        hide(task.id)
        const { selectedTaskId, closePanel } = useTaskDetailStore.getState()
        if (selectedTaskId === task.id) closePanel()

        startTransition(async () => {
            const result = await deleteTask(task.id)
            if (!result.success) {
                restore(task.id)
                toast.error('Couldn’t delete the task', { description: result.error })
                return
            }
            router.refresh()
        })
    }, [hide, restore, router])

    const duplicate = useCallback((task: T) => {
        add({
            title: `${task.title} (copy)`,
            sectionId: task.sectionId,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            priority: (task.priority as TaskPriority | null) ?? undefined,
            tags: task.tags?.map(t => t.tag),
        })
    }, [add])

    /**
     * Apply a drag: new positions for every task in the affected sections, and a
     * new section for the one that moved between them.
     */
    const reorder = useCallback((placements: Placement[], moved?: { task: T; sectionId: string | null }) => {
        for (const p of placements) begin(p.id, { sortOrder: p.sortOrder, sectionId: p.sectionId } as Partial<T>)

        startTransition(async () => {
            const sectionSave = moved ? await updateTask({ id: moved.task.id, sectionId: moved.sectionId }) : { success: true as const }
            const orderSave = sectionSave.success
                ? await updateTaskOrder(placements.map(p => ({ id: p.id, sortOrder: p.sortOrder })))
                : sectionSave

            if (!orderSave.success) {
                for (const p of placements) fail(p.id)
                toast.error('Couldn’t move the task', { description: 'error' in orderSave ? orderSave.error : undefined })
                return
            }
            for (const p of placements) settle(p.id)
            if (moved) syncPanel(moved.task.id, { sectionId: moved.sectionId, section: sections.find(s => s.id === moved.sectionId) ?? null })
            router.refresh()
        })
    }, [begin, fail, settle, syncPanel, sections, router])

    const openTask = useCallback((task: T) => {
        if (isDraft(task)) return
        useTaskDetailStore.getState().selectTask(task.id, {
            ...task,
            project: project ?? (task as { project?: unknown }).project ?? null,
            section: sections.find(s => s.id === task.sectionId) ?? null,
        })
    }, [project, sections])

    const context = useMemo<TaskTableContextValue>(
        () => ({ sections, tags, update, toggle, createTag }),
        [sections, tags, update, toggle, createTag]
    )

    return { rows, tags, context, add, remove, duplicate, reorder, openTask }
}
