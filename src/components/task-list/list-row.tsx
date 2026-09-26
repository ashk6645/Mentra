'use client'

import { memo, type KeyboardEvent, type MouseEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Maximize2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/components/second-brain/menu'
import { DoneCell, DueCell, LabelsCell, PriorityCell, SubtasksCell, TitleCell } from '@/components/task-table/cells'
import { isDraft } from '@/components/task-table/context'
import type { TaskTableTask } from '@/components/task-table/types'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useTaskSelectionStore } from '@/stores/use-task-selection-store'
import { FOCUS, ICON, INK, R, TRANSITION } from '@/lib/second-brain/ui'

export interface ListRowHandlers {
    onOpen: (task: TaskTableTask) => void
    onDuplicate: (task: TaskTableTask) => void
    onDelete: (task: TaskTableTask) => void
}

/** A click on a control inside the row belongs to that control, not the row. */
const isFromControl = (event: MouseEvent<HTMLElement>) => {
    const control = (event.target as HTMLElement).closest('button, a, input, [role="menuitem"], [data-radix-popper-content-wrapper]')
    return control !== null && control !== event.currentTarget
}

/** Square selection box for bulk-select mode — distinct from the round-cornered done box. */
function SelectBox({ selected, onToggle, title }: { selected: boolean; onToggle: () => void; title: string }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={selected ? `Deselect “${title}”` : `Select “${title}”`}
            className={cn('flex h-7 w-7 shrink-0 items-center justify-center', R.md, FOCUS)}
        >
            <span
                className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-[4px] border', TRANSITION.fast,
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-black/[0.25] dark:border-white/[0.3]'
                )}
            >
                {selected && (
                    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" aria-hidden>
                        <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
        </button>
    )
}

/**
 * One task in the list.
 *
 * Shows only the properties the task has — a list is read top to bottom, and a
 * column of empty prompts would drown the titles. Each shown property still
 * edits in place, exactly as in the table. The drag handle and the row menu
 * wait in the margins until the row is hovered or focused.
 */
function ListRowInner({
    task,
    draggable,
    handlers,
    onKeyDown,
}: {
    task: TaskTableTask
    /** Open tasks can be dragged; completed ones stay put. */
    draggable: boolean
    handlers: ListRowHandlers
    onKeyDown: (event: KeyboardEvent<HTMLLIElement>, task: TaskTableTask) => void
}) {
    const draft = isDraft(task)
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'task', sectionId: task.sectionId },
        disabled: !draggable || draft,
    })

    const active = useTaskDetailStore(state => state.selectedTaskId === task.id)
    const selecting = useTaskSelectionStore(state => state.isSelectionMode)
    const selected = useTaskSelectionStore(state => state.selectedIds.has(task.id))
    const toggleSelection = useTaskSelectionStore(state => state.toggleSelection)

    const hasMeta = Boolean(task.dueDate || task.priority || task.tags?.length || task.subtasks?.length)

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            tabIndex={0}
            data-list-row=""
            data-task-id={draft ? undefined : task.id}
            aria-current={active ? 'true' : undefined}
            onClick={event => {
                if (isFromControl(event)) return
                if (selecting) toggleSelection(task.id)
                else handlers.onOpen(task)
            }}
            onKeyDown={event => onKeyDown(event, task)}
            className={cn(
                'group/row relative flex h-10 cursor-default items-center gap-1.5 pl-1 pr-1', R.md, TRANSITION.fast,
                FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0',
                active || selected
                    ? 'bg-black/[0.045] dark:bg-white/[0.065]'
                    : 'hover:bg-black/[0.025] dark:hover:bg-white/[0.035]',
                isDragging && 'opacity-40',
                draft && 'pointer-events-none'
            )}
        >
            {/* In the left margin, so rows line up with the heading above them. */}
            {draggable && !draft && !selecting && (
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    aria-label={`Move “${task.title}”`}
                    className={cn(
                        'absolute -left-6 top-1/2 flex h-7 w-5 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-[5px] active:cursor-grabbing',
                        INK.subtle, 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 max-sm:hidden',
                        TRANSITION.fast, FOCUS
                    )}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className={ICON.md} strokeWidth={2} />
                </button>
            )}

            {selecting ? (
                <SelectBox selected={selected} onToggle={() => toggleSelection(task.id)} title={task.title} />
            ) : (
                <DoneCell task={task} />
            )}

            <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
                <TitleCell task={task} />
            </div>

            {hasMeta && (
                <div className="flex shrink-0 items-center gap-2 max-sm:hidden">
                    {task.subtasks && task.subtasks.length > 0 && <SubtasksCell task={task} />}
                    {task.tags && task.tags.length > 0 && <LabelsCell task={task} />}
                    {task.priority && <PriorityCell task={task} />}
                    {task.dueDate && <DueCell task={task} />}
                </div>
            )}

            {/* Phones get the due date alone — the one property worth the width. */}
            {task.dueDate && (
                <div className="shrink-0 sm:hidden">
                    <DueCell task={task} />
                </div>
            )}

            {!draft && (
                <div className="shrink-0 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 max-sm:hidden">
                    <ActionMenu
                        label={`Actions for “${task.title}”`}
                        actions={[
                            { label: 'Open', icon: Maximize2, onSelect: () => handlers.onOpen(task) },
                            { label: 'Duplicate', icon: Copy, onSelect: () => handlers.onDuplicate(task) },
                            { label: 'Delete', icon: Trash2, onSelect: () => handlers.onDelete(task), destructive: true, separated: true },
                        ]}
                    />
                </div>
            )}
        </li>
    )
}

export const ListRow = memo(ListRowInner)

/** The row as it looks while being dragged — lifted, following the pointer. */
export function DragPreview({ task }: { task: TaskTableTask }) {
    return (
        <div
            className={cn(
                'flex h-10 cursor-grabbing items-center gap-2.5 bg-card pl-3 pr-4', R.md,
                'border border-black/[0.08] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] dark:border-white/[0.1]'
            )}
        >
            <span className="h-4 w-4 shrink-0 rounded-[5px] border border-black/[0.2] dark:border-white/[0.22]" />
            <span className="truncate text-[13px] font-medium text-foreground">{task.title}</span>
        </div>
    )
}
