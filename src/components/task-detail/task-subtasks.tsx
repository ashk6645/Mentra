'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, Plus, X } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/second-brain/checkbox'
import { IconButton, ProgressBar } from '@/components/second-brain/primitives'
import { createSubtask, deleteSubtask, reorderSubtasks, updateSubtask } from '@/lib/actions/subtasks'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { Section, saveFailed, useApplyTaskUpdate } from './parts'
import { FOCUS, HOVER, ICON, INK, NUM, T, TRANSITION } from '@/lib/second-brain/ui'

interface Subtask {
    id: string
    title: string
    completed: boolean
    sortOrder: number
}

interface SubtaskRowProps {
    subtask: Subtask
    isReadOnly: boolean
    onToggle: (subtask: Subtask) => void
    onRename: (subtask: Subtask, title: string) => void
    onDelete: (subtask: Subtask) => void
}

/**
 * One subtask: a checkbox and a title you can edit in place, like a goal's
 * milestone. The drag handle and remove button only appear on hover, so a
 * list you're working through stays a list, not a toolbar.
 */
function SubtaskRow({ subtask, isReadOnly, onToggle, onRename, onDelete }: SubtaskRowProps) {
    const [title, setTitle] = useState(subtask.title)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: subtask.id,
        disabled: isReadOnly,
    })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'group relative flex h-10 items-center gap-3 rounded-[8px] px-2', TRANSITION.fast,
                isDragging ? 'z-10 bg-card shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]' : HOVER
            )}
        >
            {/* The handle sits in the margin, so the checklist lines up with the
                heading above it — the same edge as a goal's milestones. */}
            {!isReadOnly && (
                <button
                    type="button"
                    aria-label={`Reorder “${subtask.title}”`}
                    className={cn(
                        'absolute -left-3.5 top-1/2 flex h-6 w-4 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-[4px] active:cursor-grabbing',
                        INK.subtle, 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-60', TRANSITION.fast, FOCUS
                    )}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className={ICON.md} strokeWidth={2} />
                </button>
            )}

            <button
                type="button"
                onClick={() => onToggle(subtask)}
                disabled={isReadOnly}
                aria-pressed={subtask.completed}
                aria-label={subtask.completed ? `Mark “${subtask.title}” not done` : `Mark “${subtask.title}” done`}
                className={cn('group flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] disabled:cursor-default', FOCUS)}
            >
                <Checkbox checked={subtask.completed} size="sm" />
            </button>

            <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => {
                    const clean = title.trim()
                    if (!clean) setTitle(subtask.title)
                    else if (clean !== subtask.title) onRename(subtask, clean)
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') {
                        setTitle(subtask.title)
                        e.currentTarget.blur()
                    }
                }}
                readOnly={isReadOnly}
                maxLength={200}
                aria-label="Subtask"
                className={cn(
                    'min-w-0 flex-1 bg-transparent outline-none', T.body, 'transition-colors duration-200',
                    subtask.completed ? cn(INK.subtle, 'line-through decoration-foreground/30') : INK.strong
                )}
            />

            {!isReadOnly && (
                <IconButton
                    icon={X}
                    label={`Remove “${subtask.title}”`}
                    size="sm"
                    onClick={() => onDelete(subtask)}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-60"
                />
            )}
        </div>
    )
}

export function TaskSubtasks({
    task,
    isReadOnly = false,
}: {
    task: { id: string; subtasks?: Subtask[] }
    isReadOnly?: boolean
}) {
    const router = useRouter()
    const apply = useApplyTaskUpdate(task)
    const [subtasks, setSubtasks] = useState<Subtask[]>(
        () => [...(task.subtasks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    )
    const [draft, setDraft] = useState('')

    // Follow the panel's copy when it changes from outside — AI assist adding
    // steps — adjusting during render rather than in an effect.
    const [seen, setSeen] = useState(task.subtasks)
    if (seen !== task.subtasks) {
        setSeen(task.subtasks)
        setSubtasks([...(task.subtasks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    /** Still being created — there is no server record to change yet. */
    const pending = (subtask: Subtask) => subtask.id.startsWith('temp-')

    /** Keep the panel's copy of the task in step, so reopening it isn't stale. */
    const commit = (next: Subtask[]) => {
        setSubtasks(next)
        apply(undefined, { subtasks: next })
    }

    const toggle = async (subtask: Subtask) => {
        if (pending(subtask)) return
        const previous = subtasks
        commit(subtasks.map(s => (s.id === subtask.id ? { ...s, completed: !s.completed } : s)))
        const result = await updateSubtask(subtask.id, { completed: !subtask.completed })
        if (!result.success) {
            commit(previous)
            saveFailed('the subtask', result.error)
            return
        }
        router.refresh()
    }

    const rename = async (subtask: Subtask, title: string) => {
        if (pending(subtask)) return
        const previous = subtasks
        commit(subtasks.map(s => (s.id === subtask.id ? { ...s, title } : s)))
        const result = await updateSubtask(subtask.id, { title })
        if (!result.success) {
            commit(previous)
            saveFailed('the subtask', result.error)
            return
        }
        router.refresh()
    }

    const remove = async (subtask: Subtask) => {
        if (pending(subtask)) return
        const previous = subtasks
        commit(subtasks.filter(s => s.id !== subtask.id))
        const result = await deleteSubtask(subtask.id)
        if (!result.success) {
            commit(previous)
            saveFailed('the subtask', result.error)
            return
        }
        router.refresh()
    }

    const add = async () => {
        const title = draft.trim()
        if (!title) return
        setDraft('')

        const tempId = `temp-${crypto.randomUUID()}`
        commit([...subtasks, { id: tempId, title, completed: false, sortOrder: subtasks.length }])

        // Other edits may land while this is in flight, so the swap is applied to
        // whatever the list is by then — both the local copy and the panel's.
        const settle = (change: (list: Subtask[]) => Subtask[]) => {
            setSubtasks(change)
            const stored = useTaskDetailStore.getState().selectedTask?.subtasks as Subtask[] | undefined
            if (stored) apply(undefined, { subtasks: change(stored) })
        }

        const result = await createSubtask(task.id, title)
        if (!result.success || !result.data) {
            settle(list => list.filter(s => s.id !== tempId))
            saveFailed('subtasks', result.success ? undefined : result.error)
            return
        }
        const created = result.data
        settle(list => list.map(s => (s.id === tempId ? created : s)))
        router.refresh()
    }

    const onDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const previous = subtasks
        // Renumber as well as move. The panel re-sorts by `sortOrder` whenever its
        // copy of the task changes, so a moved list still carrying its old numbers
        // snapped straight back to the old order until the page was reloaded.
        // Index-based numbering matches what `reorderSubtasks` writes.
        const next = arrayMove(
            subtasks,
            subtasks.findIndex(s => s.id === active.id),
            subtasks.findIndex(s => s.id === over.id)
        ).map((subtask, index) => ({ ...subtask, sortOrder: index }))
        commit(next)
        const result = await reorderSubtasks(task.id, next.map(s => s.id))
        if (!result.success) {
            commit(previous)
            saveFailed('the order', result.error)
            return
        }
        // Like every other subtask change: refresh the task list's data, so
        // reopening this task shows the new order too.
        router.refresh()
    }

    const done = subtasks.filter(s => s.completed).length

    if (isReadOnly && subtasks.length === 0) return null

    return (
        <Section
            title="Subtasks"
            meta={
                subtasks.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                        <ProgressBar percent={(done / subtasks.length) * 100} className="w-16" label="Subtasks done" />
                        <span className={cn(T.meta, NUM, INK.subtle)}>{done} of {subtasks.length}</span>
                    </div>
                ) : null
            }
        >
            <div className="-mx-2 flex flex-col">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={subtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {subtasks.map(subtask => (
                            <SubtaskRow
                                key={subtask.id}
                                subtask={subtask}
                                isReadOnly={isReadOnly}
                                onToggle={toggle}
                                onRename={rename}
                                onDelete={remove}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {!isReadOnly && (
                    <div className="flex h-10 items-center gap-3 px-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                            <Plus className={cn(ICON.md, INK.subtle)} strokeWidth={2} />
                        </span>
                        <input
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    add()
                                }
                            }}
                            onBlur={add}
                            placeholder="Add a subtask"
                            aria-label="New subtask"
                            maxLength={200}
                            className={cn('min-w-0 flex-1 bg-transparent outline-none', T.body, INK.strong, 'placeholder:text-muted-foreground/55')}
                        />
                    </div>
                )}
            </div>
        </Section>
    )
}
