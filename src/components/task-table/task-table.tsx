'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type ColumnDef, type RowGroup } from '@/components/data-table'
import { cn } from '@/lib/utils'
import { createTask, toggleTaskCompletion, updateTask } from '@/lib/actions/tasks'
import { createTag as createTagAction, getTags } from '@/lib/actions/tags'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { TaskTableContext, isDraft, type TaskTableContextValue } from './context'
import { DEFAULT_HIDDEN, TASK_COLUMNS } from './columns'
import { TaskTableToolbar } from './toolbar'
import { useOptimisticTasks } from './use-optimistic-tasks'
import { useTablePrefs } from './use-table-prefs'
import type { GroupBy, TaskColumnId, TaskTablePrefs, TaskTableSection, TaskTableTag, TaskTableTask } from './types'
import { FOCUS, HOVER, ICON, INK, T, TRANSITION } from '@/lib/second-brain/ui'

export interface TaskTableProps<T extends TaskTableTask> {
    tasks: T[]
    /** The container's sections. Enables grouping and the Section column. */
    sections?: TaskTableSection[]
    /** Where new tasks go. */
    projectId?: string | null
    /** Shown as the task's location when it opens in the detail panel. */
    project?: { id: string; name: string; icon: string | null; color: string } | null
    /** Names this table's remembered sort, columns and grouping — one per place it's used. */
    storageKey: string
    ariaLabel?: string
}

const NO_SECTION = '__none__'

/** Unfinished work first, in the user's own order; finished work after it. */
const byManualOrder = (a: TaskTableTask, b: TaskTableTask) =>
    Number(a.completed) - Number(b.completed) || a.sortOrder - b.sortOrder

/** An inline "new task" line, left open after each add so several go in quickly. */
function AddTaskRow({ onAdd }: { onAdd: (title: string) => void }) {
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState('')

    const commit = () => {
        const clean = title.trim()
        if (clean) onAdd(clean)
        setTitle('')
    }

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn(
                    'flex h-10 w-full items-center gap-2 pl-[18px] text-left',
                    T.body, INK.subtle, HOVER, TRANSITION.fast, 'hover:text-foreground',
                    FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
                )}
            >
                <Plus className={ICON.md} strokeWidth={2} />
                New task
            </button>
        )
    }

    return (
        <div className="flex h-10 items-center gap-2 pl-[18px] pr-3">
            <Plus className={cn(ICON.md, 'shrink-0', INK.subtle)} strokeWidth={2} />
            <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') commit()
                    if (e.key === 'Escape') {
                        e.stopPropagation()
                        setTitle('')
                        setEditing(false)
                    }
                }}
                onBlur={() => {
                    commit()
                    setEditing(false)
                }}
                placeholder="Task name, then Enter"
                aria-label="New task"
                maxLength={500}
                className={cn('min-w-0 flex-1 bg-transparent outline-none', T.body, INK.strong, 'placeholder:text-muted-foreground/55')}
            />
        </div>
    )
}

/**
 * Tasks as a table: sortable, filterable, grouped by section, edited in place.
 *
 * Self-contained — hand it tasks and it does the rest, saving through the same
 * server actions as the rest of the app — so it can sit in a project today and
 * anywhere tasks are listed later. Clicking a row opens the usual detail panel.
 */
export function TaskTable<T extends TaskTableTask>({
    tasks,
    sections = [],
    projectId = null,
    project = null,
    storageKey,
    ariaLabel = 'Tasks',
}: TaskTableProps<T>) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const activeTaskId = useTaskDetailStore(state => state.selectedTaskId)

    const [prefs, setPrefs] = useTablePrefs(storageKey, {
        sort: null,
        hidden: DEFAULT_HIDDEN,
        showCompleted: false,
        groupBy: 'section',
    } satisfies TaskTablePrefs)

    const [query, setQuery] = useState('')
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
    const [tags, setTags] = useState<TaskTableTag[]>([])
    const { rows, begin, settle, fail, addDraft, resolveDraft, dropDraft } = useOptimisticTasks(tasks)

    useEffect(() => {
        let live = true
        getTags().then(result => {
            if (live) setTags(result.map(tag => ({ id: tag.id, name: tag.name })))
        })
        return () => {
            live = false
        }
    }, [])

    // ─── Changing tasks ──────────────────────────────────────────────────────

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

    /** Completing goes through the same path as the list, so repeating tasks roll over. */
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

    const add = useCallback((title: string, sectionId: string | null) => {
        const tempId = `draft-${crypto.randomUUID()}`
        addDraft(tempId, {
            id: tempId, title, completed: false, priority: null, dueDate: null,
            projectId, sectionId, sortOrder: Number.MAX_SAFE_INTEGER,
            createdAt: new Date().toISOString(), tags: [], subtasks: [],
        } as unknown as T)

        startTransition(async () => {
            const result = await createTask({ title, projectId, sectionId })
            if (!result.success || !result.data) {
                dropDraft(tempId)
                toast.error('Couldn’t add the task', { description: result.success ? undefined : result.error })
                return
            }
            resolveDraft(tempId, result.data.id)
            router.refresh()
        })
    }, [addDraft, dropDraft, resolveDraft, projectId, router])

    const openTask = useCallback((task: T) => {
        if (isDraft(task)) return
        useTaskDetailStore.getState().selectTask(task.id, {
            ...task,
            project: project ?? (task as { project?: unknown }).project ?? null,
            section: sections.find(s => s.id === task.sectionId) ?? null,
        })
    }, [project, sections])

    // ─── What to show ────────────────────────────────────────────────────────

    const grouped: GroupBy = sections.length > 0 ? prefs.groupBy : 'none'

    // Section means nothing where there are no sections, and says nothing new
    // while rows already sit under their section's heading.
    const unavailable = useMemo<TaskColumnId[]>(
        () => (sections.length === 0 || grouped === 'section' ? ['section'] : []),
        [sections.length, grouped]
    )

    // Rebuilt only when the choice of columns changes, never per edit.
    const columns = useMemo(() => {
        const sectionRank = new Map(sections.map((s, index) => [s.id, index]))
        return TASK_COLUMNS
            .filter(column => !unavailable.includes(column.id) && !(column.hideable && prefs.hidden.includes(column.id)))
            .map(column =>
                column.id === 'section'
                    ? { ...column, sortValue: (task: TaskTableTask) => sectionRank.get(task.sectionId ?? '') ?? null }
                    : column
            ) as ColumnDef<T>[]
    }, [sections, prefs.hidden, unavailable])

    const needle = query.trim().toLowerCase()
    const completedCount = rows.filter(task => task.completed).length

    const visible = useMemo(
        () =>
            rows
                .filter(task => prefs.showCompleted || !task.completed)
                .filter(task => !needle || task.title.toLowerCase().includes(needle))
                .sort(byManualOrder),
        [rows, prefs.showCompleted, needle]
    )

    const groups = useMemo<RowGroup<T>[] | undefined>(() => {
        if (grouped !== 'section') return undefined

        const bySection = new Map<string, T[]>()
        for (const task of visible) {
            const key = task.sectionId && sections.some(s => s.id === task.sectionId) ? task.sectionId : NO_SECTION
            bySection.set(key, [...(bySection.get(key) ?? []), task])
        }

        const all = [
            ...sections.map(section => ({ id: section.id, label: section.name })),
            { id: NO_SECTION, label: 'No section' },
        ]

        return all
            // While filtering, empty groups are just noise. Otherwise every section
            // shows, so there's always somewhere to add a task.
            .filter(group => (bySection.get(group.id)?.length ?? 0) > 0 || (!needle && group.id !== NO_SECTION))
            .map(group => ({
                ...group,
                rows: bySection.get(group.id) ?? [],
                footer: <AddTaskRow onAdd={title => add(title, group.id === NO_SECTION ? null : group.id)} />,
            }))
    }, [grouped, visible, sections, needle, add])

    const context = useMemo<TaskTableContextValue>(
        () => ({ sections, tags, update, toggle, createTag }),
        [sections, tags, update, toggle, createTag]
    )

    const toggleGroup = useCallback((id: string) => {
        setCollapsed(previous => {
            const next = new Set(previous)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    return (
        <TaskTableContext.Provider value={context}>
            <div className="flex flex-col gap-3">
                <TaskTableToolbar
                    query={query}
                    onQueryChange={setQuery}
                    showCompleted={prefs.showCompleted}
                    onShowCompletedChange={showCompleted => setPrefs({ showCompleted })}
                    completedCount={completedCount}
                    groupBy={grouped}
                    onGroupByChange={groupBy => setPrefs({ groupBy })}
                    canGroup={sections.length > 0}
                    hidden={prefs.hidden}
                    onHiddenChange={hidden => setPrefs({ hidden })}
                    unavailable={unavailable}
                />

                <DataTable<T>
                    ariaLabel={ariaLabel}
                    columns={columns}
                    rows={groups ? undefined : visible}
                    groups={groups}
                    getRowId={getTaskId}
                    sort={prefs.sort}
                    onSortChange={sort => setPrefs({ sort })}
                    onRowOpen={openTask}
                    getRowAttributes={taskRowAttributes}
                    activeRowId={activeTaskId}
                    collapsedGroups={collapsed}
                    onToggleGroup={toggleGroup}
                    empty={
                        needle ? (
                            <p className={cn('px-4 py-10 text-center', T.body, INK.muted)}>
                                No tasks match “{query.trim()}”
                            </p>
                        ) : undefined
                    }
                    footer={groups ? undefined : <AddTaskRow onAdd={title => add(title, null)} />}
                />
            </div>
        </TaskTableContext.Provider>
    )
}

const getTaskId = (task: TaskTableTask) => task.id

/**
 * `data-task-id` hooks the rows into the app-wide j/k/x/e shortcuts, which find
 * tasks by that attribute. Drafts have no real id yet, so they stay out.
 */
const taskRowAttributes = (task: TaskTableTask) => (isDraft(task) ? {} : { 'data-task-id': task.id })
