'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ArrowDown, ArrowUp, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/components/second-brain/menu'
import { IconButton } from '@/components/second-brain/primitives'
import { isDraftSection } from './use-section-actions'
import { FIELD_FOCUS, FOCUS, HAIRLINE, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

/** The drop target id for a section — its heading and body both accept tasks. */
export const containerId = (sectionId: string) => `container:${sectionId}`

/**
 * A section's heading: its name, how many open tasks it holds, and the few
 * things you do to a section.
 *
 * Text and a hairline, not a filled bar — a heading organises the page, it
 * shouldn't compete with the tasks. Click the name to rename it in place. The
 * heading is also a drop target, so a task can be dragged onto a collapsed
 * section.
 */
export function SectionHeading({
    id,
    name,
    count,
    collapsed,
    first,
    last,
    onToggle,
    onRename,
    onMove,
    onDelete,
    onAddTask,
}: {
    id: string
    name: string
    count: number
    collapsed: boolean
    first: boolean
    last: boolean
    onToggle: () => void
    onRename: (name: string) => void
    onMove: (direction: -1 | 1) => void
    onDelete: () => void
    onAddTask: () => void
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(name)
    const { setNodeRef, isOver } = useDroppable({ id: containerId(id), data: { type: 'section' } })
    const pending = isDraftSection(id)

    const startRename = () => {
        setDraft(name)
        setEditing(true)
    }

    const finishRename = () => {
        setEditing(false)
        if (draft.trim() && draft.trim() !== name) onRename(draft)
    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'group/heading flex h-10 items-center gap-1 border-b pl-1 pr-1', HAIRLINE, TRANSITION.fast,
                isOver && collapsed && 'rounded-t-[8px] bg-black/[0.03] dark:bg-white/[0.04]',
                pending && 'opacity-60'
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={!collapsed}
                aria-label={collapsed ? `Expand ${name}` : `Collapse ${name}`}
                className={cn('flex h-7 w-7 shrink-0 items-center justify-center', R.md, INK.subtle, TRANSITION.fast, FOCUS,
                    'hover:bg-black/[0.045] hover:text-foreground dark:hover:bg-white/[0.06]')}
            >
                <ChevronRight className={cn(ICON.md, 'transition-transform duration-200', !collapsed && 'rotate-90')} strokeWidth={2.25} />
            </button>

            {editing ? (
                <input
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={finishRename}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                        if (e.key === 'Escape') {
                            e.stopPropagation()
                            setDraft(name)
                            setEditing(false)
                        }
                    }}
                    maxLength={100}
                    aria-label="Section name"
                    className={cn('h-7 min-w-0 flex-1 border bg-transparent px-2', R.md, HAIRLINE, T.title, INK.strong, FIELD_FOCUS)}
                />
            ) : (
                <button
                    type="button"
                    onClick={startRename}
                    disabled={pending}
                    title="Rename section"
                    className={cn('min-w-0 truncate px-1 text-left', R.sm, T.title, INK.strong, FOCUS, 'hover:text-foreground/80')}
                >
                    {name}
                </button>
            )}

            {!editing && <span className={cn('px-1', T.meta, NUM, INK.subtle)}>{count}</span>}

            <div className="flex-1" />

            {!editing && !pending && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover/heading:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 max-sm:opacity-100">
                    <IconButton icon={Plus} label={`Add a task to ${name}`} onClick={onAddTask} />
                    <ActionMenu
                        label={`Actions for ${name}`}
                        actions={[
                            { label: 'Rename', icon: Pencil, onSelect: startRename },
                            ...(!first ? [{ label: 'Move up', icon: ArrowUp, onSelect: () => onMove(-1) }] : []),
                            ...(!last ? [{ label: 'Move down', icon: ArrowDown, onSelect: () => onMove(1) }] : []),
                            { label: 'Delete section', icon: Trash2, onSelect: onDelete, destructive: true, separated: true },
                        ]}
                    />
                </div>
            )}
        </div>
    )
}

/**
 * Where a new section goes.
 *
 * Between sections it is invisible until the pointer is over the gap, then a
 * line and a small "Add section" label appear — so it exists exactly where a
 * section could be added, without a button on the page for every gap.
 */
export function AddSection({ onAdd, persistent = false }: { onAdd: (name: string) => void; persistent?: boolean }) {
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState('')

    const commit = () => {
        if (name.trim()) onAdd(name)
        setName('')
        setEditing(false)
    }

    if (editing) {
        return (
            <div className="py-2">
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') commit()
                        if (e.key === 'Escape') {
                            e.stopPropagation()
                            setName('')
                            setEditing(false)
                        }
                    }}
                    maxLength={100}
                    placeholder="Section name"
                    aria-label="New section name"
                    className={cn('h-9 w-full border bg-transparent px-3', R.md, HAIRLINE, T.title, INK.strong,
                        'placeholder:font-normal placeholder:text-muted-foreground/55', FIELD_FOCUS)}
                />
            </div>
        )
    }

    if (persistent) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn('mt-2 flex h-9 items-center gap-1 pl-1 pr-3', R.md, T.body, INK.subtle, TRANSITION.fast, FOCUS,
                    'hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.04]')}
            >
                {/* Same 28px column as a heading's chevron, so the icons line up. */}
                <span className="flex h-7 w-7 items-center justify-center">
                    <Plus className={ICON.md} strokeWidth={2} />
                </span>
                Add section
            </button>
        )
    }

    return (
        <div className="group/gap relative flex h-5 items-center">
            <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn(
                    'relative flex w-full items-center justify-center opacity-0 group-hover/gap:opacity-100 focus-visible:opacity-100',
                    TRANSITION.base, FOCUS, 'rounded-full'
                )}
            >
                <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-primary/40" />
                <span className={cn('relative flex items-center gap-1 bg-background px-2', T.meta, 'font-medium text-primary')}>
                    <Plus className={ICON.sm} strokeWidth={2.5} />
                    Add section
                </span>
            </button>
        </div>
    )
}
