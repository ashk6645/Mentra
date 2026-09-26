'use client'

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/second-brain/confirm-dialog'
import { TaskTableContext } from '@/components/task-table/context'
import { useTablePrefs } from '@/components/task-table/use-table-prefs'
import { useTaskActions } from '@/components/task-table/use-task-actions'
import type { TaskTablePrefs, TaskTableSection, TaskTableTask } from '@/components/task-table/types'
import { DEFAULT_HIDDEN } from '@/components/task-table/columns'
import { DragPreview, ListRow, type ListRowHandlers } from './list-row'
import { QuickAdd } from './quick-add'
import { AddSection, SectionHeading, containerId } from './section-heading'
import { useSectionActions } from './use-section-actions'
import { findContainer, moveAcross, settleDrop, type Order } from './order'
import { FOCUS, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

export interface TaskListProps<T extends TaskTableTask> {
    tasks: T[]
    sections: TaskTableSection[]
    projectId: string
    /** Shown as the task's location when it opens in the detail panel. */
    project?: { id: string; name: string; icon: string | null; color: string } | null
    /** Shared with the table view of the same place, so both remember the same choices. */
    storageKey: string
    ariaLabel?: string
}

/** Tasks outside any section live in this container, at the top with no heading. */
const NONE = '__none__'

const byPosition = (a: TaskTableTask, b: TaskTableTask) =>
    a.sortOrder - b.sortOrder || String(a.createdAt).localeCompare(String(b.createdAt))

/** A section's tasks: a sortable list that also accepts drops when empty. */
function Container({ id, ids, children, footer }: { id: string; ids: string[]; children: ReactNode; footer?: ReactNode }) {
    const { setNodeRef } = useDroppable({ id: containerId(id) })
    return (
        <div ref={setNodeRef}>
            <SortableContext id={id} items={ids} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col">{children}</ul>
            </SortableContext>
            {footer}
        </div>
    )
}

/**
 * A project's tasks as a list, grouped under its sections.
 *
 * The calm default view: tasks with no section at the top, each section a quiet
 * heading over its tasks, finished work folded away at the bottom. Tasks drag
 * within and between sections; sections are added in the gaps between them,
 * renamed in place and reordered from their menu. Reusable wherever a set of
 * tasks has sections — it needs only the tasks, the sections and where new
 * ones go.
 */
export function TaskList<T extends TaskTableTask>({
    tasks,
    sections: serverSections,
    projectId,
    project = null,
    storageKey,
    ariaLabel = 'Tasks',
}: TaskListProps<T>) {
    const { sections, create: createSection, rename, move, remove: removeSection } = useSectionActions(projectId, serverSections)
    const { rows, context, add, remove, duplicate, reorder, openTask } = useTaskActions({
        tasks,
        sections,
        projectId,
        project,
    })
    const [prefs, setPrefs] = useTablePrefs(storageKey, {
        sort: null,
        hidden: DEFAULT_HIDDEN,
        showCompleted: false,
        groupBy: 'section',
        collapsed: [],
    } satisfies TaskTablePrefs)
    const { confirm, dialog } = useConfirm()
    const rootRef = useRef<HTMLDivElement>(null)

    /** Which container's add-task line is open. One at a time. */
    const [adding, setAdding] = useState<string | null>(null)
    /** While dragging: the working order, and where the dragged task started. */
    const [drag, setDrag] = useState<{ order: Order; activeId: string; from: string } | null>(null)

    const collapsed = useMemo(() => new Set(prefs.collapsed), [prefs.collapsed])
    const byId = useMemo(() => new Map(rows.map(task => [task.id, task])), [rows])

    // ─── Grouping ────────────────────────────────────────────────────────────

    const openOrder = useMemo<Order>(() => {
        const known = new Set(sections.map(s => s.id))
        const order: Order = { [NONE]: [] }
        for (const s of sections) order[s.id] = []

        for (const task of [...rows].filter(t => !t.completed).sort(byPosition)) {
            const key = task.sectionId && known.has(task.sectionId) ? task.sectionId : NONE
            order[key].push(task.id)
        }
        return order
    }, [rows, sections])

    const completed = useMemo(() => rows.filter(task => task.completed).sort(byPosition), [rows])
    const order = drag?.order ?? openOrder

    // ─── Dragging ────────────────────────────────────────────────────────────

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const onDragStart = ({ active }: DragStartEvent) => {
        const id = String(active.id)
        setDrag({ order: openOrder, activeId: id, from: findContainer(id, openOrder) ?? NONE })
    }

    /** Crossing into another section moves the task there straight away, so the gap opens where it will land. */
    const onDragOver = ({ active, over }: DragOverEvent) => {
        if (!over) return
        setDrag(current => {
            if (!current) return current
            const order = moveAcross(current.order, String(active.id), String(over.id))
            return order === current.order ? current : { ...current, order }
        })
    }

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        const current = drag
        setDrag(null)
        if (!current || !over) return

        const result = settleDrop(current.order, openOrder, current.from, String(active.id), String(over.id))
        if (!result) return

        const task = byId.get(String(active.id))
        const sectionId = result.container === NONE ? null : result.container
        reorder(
            result.ids.map((id, index) => ({ id, sectionId, sortOrder: index })),
            task && result.moved ? { task, sectionId } : undefined
        )
    }

    // ─── Rows ────────────────────────────────────────────────────────────────

    const askDelete = useCallback(
        async (task: TaskTableTask) => {
            const ok = await confirm({
                title: 'Delete this task?',
                description: `“${task.title}” and its subtasks will be deleted. This can’t be undone.`,
                confirmLabel: 'Delete task',
                destructive: true,
            })
            if (ok) remove(task as T)
        },
        [confirm, remove]
    )

    const handlers = useMemo<ListRowHandlers>(
        () => ({
            onOpen: task => openTask(task as T),
            onDuplicate: task => duplicate(task as T),
            onDelete: askDelete,
        }),
        [openTask, duplicate, askDelete]
    )

    /** Enter opens a row; the arrows move between rows, across sections. */
    const onRowKeyDown = useCallback((event: KeyboardEvent<HTMLLIElement>, task: TaskTableTask) => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter') {
            event.preventDefault()
            handlers.onOpen(task)
            return
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        event.preventDefault()
        const all = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-list-row]') ?? [])
        all[all.indexOf(event.currentTarget) + (event.key === 'ArrowDown' ? 1 : -1)]?.focus()
    }, [handlers])

    const renderRows = (ids: string[], draggable: boolean) =>
        ids.map(id => {
            const task = byId.get(id)
            return task ? <ListRow key={id} task={task} draggable={draggable} handlers={handlers} onKeyDown={onRowKeyDown} /> : null
        })

    const quickAdd = (key: string) => (
        <QuickAdd
            sectionId={key === NONE ? null : key}
            onAdd={add}
            open={adding === key}
            onOpenChange={open => setAdding(open ? key : null)}
        />
    )

    // ─── Sections ────────────────────────────────────────────────────────────

    const toggleCollapsed = (id: string) =>
        setPrefs({ collapsed: collapsed.has(id) ? prefs.collapsed.filter(c => c !== id) : [...prefs.collapsed, id] })

    const askDeleteSection = async (id: string, name: string) => {
        const count = order[id]?.length ?? 0
        const ok = await confirm({
            title: `Delete “${name}”?`,
            description: count > 0
                ? `Its ${count} ${count === 1 ? 'task stays' : 'tasks stay'} in the project, moved out of the section.`
                : 'The section is empty, so nothing else changes.',
            confirmLabel: 'Delete section',
            destructive: true,
        })
        if (ok) removeSection(id)
    }

    const activeTask = drag ? byId.get(drag.activeId) : undefined
    const empty = rows.length === 0 && sections.length === 0

    return (
        <TaskTableContext.Provider value={context}>
            {dialog}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={() => setDrag(null)}
            >
                <div ref={rootRef} role="region" aria-label={ariaLabel} className="flex flex-col">
                    {empty && (
                        <p className={cn('px-2 pb-2', T.body, INK.muted)}>
                            No tasks yet. Add one below, or split the work into sections.
                        </p>
                    )}

                    {/* Tasks outside any section — first, with no heading. */}
                    <Container id={NONE} ids={order[NONE]} footer={quickAdd(NONE)}>
                        {renderRows(order[NONE], true)}
                    </Container>

                    {sections.map((section, index) => {
                        const isCollapsed = collapsed.has(section.id)
                        const ids = order[section.id] ?? []
                        return (
                            <div key={section.id}>
                                <AddSection onAdd={name => createSection(name, index)} />
                                <section aria-label={section.name}>
                                    <SectionHeading
                                        id={section.id}
                                        name={section.name}
                                        count={ids.length}
                                        collapsed={isCollapsed}
                                        first={index === 0}
                                        last={index === sections.length - 1}
                                        onToggle={() => toggleCollapsed(section.id)}
                                        onRename={name => rename(section.id, name)}
                                        onMove={direction => move(section.id, direction)}
                                        onDelete={() => askDeleteSection(section.id, section.name)}
                                        onAddTask={() => {
                                            if (isCollapsed) toggleCollapsed(section.id)
                                            setAdding(section.id)
                                        }}
                                    />
                                    {!isCollapsed && (
                                        <div className="pt-1">
                                            <Container id={section.id} ids={ids} footer={quickAdd(section.id)}>
                                                {renderRows(ids, true)}
                                            </Container>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )
                    })}

                    <AddSection persistent onAdd={name => createSection(name, sections.length)} />

                    {/* Finished work, folded away until asked for. */}
                    {completed.length > 0 && (
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setPrefs({ showCompleted: !prefs.showCompleted })}
                                aria-expanded={prefs.showCompleted}
                                className={cn('flex h-9 items-center gap-2 px-2', R.md, T.body, INK.muted, TRANSITION.fast, FOCUS,
                                    'hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.04]')}
                            >
                                <ChevronRight className={cn(ICON.md, 'transition-transform duration-200', prefs.showCompleted && 'rotate-90')} strokeWidth={2.25} />
                                Completed
                                <span className={cn(NUM, INK.subtle)}>{completed.length}</span>
                            </button>
                            {prefs.showCompleted && (
                                <ul className="flex flex-col pt-1">
                                    {completed.map(task => (
                                        <ListRow key={task.id} task={task} draggable={false} handlers={handlers} onKeyDown={onRowKeyDown} />
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
                    {activeTask ? <DragPreview task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>
        </TaskTableContext.Provider>
    )
}
