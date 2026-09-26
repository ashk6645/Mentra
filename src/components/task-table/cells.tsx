'use client'

import { forwardRef, useState, type ComponentProps } from 'react'
import { addDays, format, nextMonday, startOfDay } from 'date-fns'
import { Calendar, Check, Flag, Layers, Plus, Tag } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Checkbox } from '@/components/second-brain/checkbox'
import { Strike } from '@/components/second-brain/primitives'
import { OptionRow, POPOVER } from '@/components/task-detail/parts'
import { cn } from '@/lib/utils'
import { isDraft, useTaskTable } from './context'
import { dueDatePatch, dueLabel, isOverdue } from './due-date'
import type { TaskPriority, TaskTableTask } from './types'
import { FOCUS, HAIRLINE, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

/**
 * The table's cells. Each reads the table through context and edits in place:
 * click a value, pick a new one, done.
 *
 * An empty value shows nothing until its row is hovered, then a faint prompt —
 * so a sparse table stays calm, but every empty cell is still discoverable.
 */

export const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'medium', label: 'Medium', color: 'text-blue-500' },
    { value: 'low', label: 'Low', color: 'text-muted-foreground' },
]

/** The clickable value inside a cell. Quiet until hovered, like the task panel's values. */
const CellButton = forwardRef<HTMLButtonElement, ComponentProps<'button'> & { empty?: boolean }>(
    function CellButton({ empty, className, children, type = 'button', ...props }, ref) {
        return (
            <button
                ref={ref}
                type={type}
                className={cn(
                    '-mx-1.5 flex h-7 min-w-0 max-w-[calc(100%+0.75rem)] items-center gap-1.5 px-1.5', R.md, T.body,
                    TRANSITION.fast, FOCUS, 'hover:bg-black/[0.045] dark:hover:bg-white/[0.06]',
                    'disabled:pointer-events-none',
                    empty && cn(INK.subtle, 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100'),
                    className
                )}
                {...props}
            >
                {children}
            </button>
        )
    }
)

const Divider = () => <div className={cn('my-1 border-t', HAIRLINE)} />

// ─── Done ────────────────────────────────────────────────────────────────────

/**
 * `role="checkbox"` is deliberate: the app-wide `x` shortcut completes the
 * focused task by clicking the checkbox inside its row, and finds it by role.
 */
export function DoneCell({ task }: { task: TaskTableTask }) {
    const { toggle } = useTaskTable()
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={task.completed}
            aria-label={task.completed ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`}
            disabled={isDraft(task)}
            onClick={() => toggle(task)}
            className={cn('group flex h-7 w-7 items-center justify-center', R.md, FOCUS)}
        >
            <Checkbox checked={task.completed} size="sm" />
        </button>
    )
}

// ─── Title ───────────────────────────────────────────────────────────────────

export function TitleCell({ task }: { task: TaskTableTask }) {
    return (
        <Strike done={task.completed} className={cn('min-w-0 flex-1', T.body, 'font-medium', isDraft(task) && 'opacity-60')}>
            {task.title}
        </Strike>
    )
}

// ─── Due date ────────────────────────────────────────────────────────────────

export function DueCell({ task }: { task: TaskTableTask }) {
    const { update } = useTaskTable()
    const [open, setOpen] = useState(false)
    const label = dueLabel(task)
    const late = isOverdue(task)

    const choose = (day: Date | null) => {
        setOpen(false)
        const payload = dueDatePatch(task, day)
        update(task, payload, payload, 'the date')
    }

    const today = startOfDay(new Date())
    const quick = [
        { label: 'Today', day: today },
        { label: 'Tomorrow', day: addDays(today, 1) },
        { label: 'Next week', day: nextMonday(today) },
    ]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={isDraft(task)}>
                <CellButton
                    empty={!label}
                    className={cn(NUM, late && 'text-red-600 dark:text-red-400', task.completed && INK.subtle)}
                    aria-label={label ? `Due ${label}` : 'Set a due date'}
                >
                    <Calendar className={cn(ICON.md, 'shrink-0', !late && 'opacity-60')} strokeWidth={1.75} />
                    <span className="truncate">{label ?? 'Set date'}</span>
                </CellButton>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn(POPOVER, 'w-auto p-0')}>
                <div className={cn('grid grid-cols-3 gap-1 border-b p-2', HAIRLINE)}>
                    {quick.map(q => (
                        <button
                            key={q.label}
                            type="button"
                            onClick={() => choose(q.day)}
                            className={cn(
                                'h-7 px-2', R.md, T.meta, 'font-medium', INK.default, TRANSITION.fast, FOCUS,
                                'bg-black/[0.035] hover:bg-black/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.09]'
                            )}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
                <CalendarPicker
                    mode="single"
                    selected={task.dueDate ? new Date(task.dueDate) : undefined}
                    onSelect={day => choose(day ?? null)}
                    initialFocus
                />
                {task.dueDate && (
                    <div className={cn('border-t p-1', HAIRLINE)}>
                        <OptionRow onSelect={() => choose(null)}>
                            <span className={INK.muted}>Clear date</span>
                        </OptionRow>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

// ─── Priority ────────────────────────────────────────────────────────────────

export function PriorityCell({ task }: { task: TaskTableTask }) {
    const { update } = useTaskTable()
    const [open, setOpen] = useState(false)
    const current = PRIORITIES.find(p => p.value === task.priority)

    const choose = (value: TaskPriority | null) => {
        setOpen(false)
        if (value === (task.priority ?? null)) return
        update(task, { priority: value }, { priority: value }, 'the priority')
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={isDraft(task)}>
                <CellButton empty={!current} aria-label={current ? `Priority ${current.label}` : 'Set a priority'}>
                    <Flag
                        className={cn(ICON.md, 'shrink-0', current ? cn(current.color, 'fill-current') : 'opacity-60')}
                        strokeWidth={1.75}
                    />
                    <span className="truncate">{current?.label ?? 'Priority'}</span>
                </CellButton>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn(POPOVER, 'w-44')}>
                {PRIORITIES.map(p => (
                    <OptionRow key={p.value} selected={current?.value === p.value} onSelect={() => choose(p.value)}>
                        <Flag className={cn(ICON.md, p.color, 'fill-current')} strokeWidth={1.75} />
                        <span className="flex-1">{p.label}</span>
                        {current?.value === p.value && <Check className={cn(ICON.md, INK.muted)} />}
                    </OptionRow>
                ))}
                <Divider />
                <OptionRow selected={!current} onSelect={() => choose(null)}>
                    <Flag className={cn(ICON.md, INK.subtle)} strokeWidth={1.75} />
                    <span className={cn('flex-1', INK.muted)}>None</span>
                    {!current && <Check className={cn(ICON.md, INK.muted)} />}
                </OptionRow>
            </PopoverContent>
        </Popover>
    )
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function SectionCell({ task }: { task: TaskTableTask }) {
    const { sections, update } = useTaskTable()
    const [open, setOpen] = useState(false)
    const current = sections.find(s => s.id === task.sectionId)

    const choose = (sectionId: string | null) => {
        setOpen(false)
        if (sectionId === task.sectionId) return
        update(task, { sectionId }, { sectionId }, 'the section')
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={isDraft(task)}>
                <CellButton empty={!current} aria-label={current ? `Section ${current.name}` : 'Choose a section'}>
                    <Layers className={cn(ICON.md, 'shrink-0 opacity-60')} strokeWidth={1.75} />
                    <span className="truncate">{current?.name ?? 'Section'}</span>
                </CellButton>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn(POPOVER, 'max-h-72 w-56 overflow-y-auto')}>
                <OptionRow selected={!current} onSelect={() => choose(null)}>
                    <span className={cn('flex-1', INK.muted)}>No section</span>
                    {!current && <Check className={cn(ICON.md, INK.muted)} />}
                </OptionRow>
                {sections.length > 0 && <Divider />}
                {sections.map(s => (
                    <OptionRow key={s.id} selected={current?.id === s.id} onSelect={() => choose(s.id)}>
                        <span className="flex-1 truncate">{s.name}</span>
                        {current?.id === s.id && <Check className={cn(ICON.md, INK.muted)} />}
                    </OptionRow>
                ))}
            </PopoverContent>
        </Popover>
    )
}

// ─── Labels ──────────────────────────────────────────────────────────────────

/** Two labels fit; the rest fold into "+N" so a busy row stays one line. */
const VISIBLE_LABELS = 2

export function LabelsCell({ task }: { task: TaskTableTask }) {
    const { tags, update, createTag } = useTaskTable()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const selected = (task.tags ?? []).map(t => t.tag)
    const selectedIds = new Set(selected.map(t => t.id))

    const toggle = (tagId: string, known = tags) => {
        const next = selectedIds.has(tagId)
            ? selected.filter(t => t.id !== tagId)
            : [...selected, known.find(t => t.id === tagId)!].filter(Boolean)
        update(task, { tags: next.map(tag => ({ tag })) }, { tagIds: next.map(t => t.id) }, 'labels')
    }

    const create = async () => {
        const name = query.trim()
        if (!name) return
        setQuery('')
        const created = await createTag(name)
        if (created) toggle(created.id, [...tags, created])
    }

    return (
        <Popover open={open} onOpenChange={next => {
            setOpen(next)
            if (!next) setQuery('')
        }}>
            <PopoverTrigger asChild disabled={isDraft(task)}>
                <CellButton empty={selected.length === 0} aria-label={selected.length ? `Labels: ${selected.map(t => t.name).join(', ')}` : 'Add labels'}>
                    {selected.length === 0 ? (
                        <>
                            <Tag className={cn(ICON.md, 'shrink-0 opacity-60')} strokeWidth={1.75} />
                            <span>Labels</span>
                        </>
                    ) : (
                        <span className="flex min-w-0 items-center gap-1">
                            {selected.slice(0, VISIBLE_LABELS).map(tag => (
                                <span
                                    key={tag.id}
                                    className={cn('inline-flex h-5 min-w-0 items-center border px-1.5', R.sm, HAIRLINE, T.meta, INK.default)}
                                >
                                    <span className="truncate">{tag.name}</span>
                                </span>
                            ))}
                            {selected.length > VISIBLE_LABELS && (
                                <span className={cn(T.meta, NUM, INK.subtle)}>+{selected.length - VISIBLE_LABELS}</span>
                            )}
                        </span>
                    )}
                </CellButton>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn(POPOVER, 'w-56 p-0')}>
                <Command>
                    <CommandInput placeholder="Find or create…" value={query} onValueChange={setQuery} />
                    <CommandList>
                        <CommandEmpty className="p-1">
                            {query.trim() ? (
                                <OptionRow onSelect={create}>
                                    <Plus className={cn(ICON.md, INK.muted)} />
                                    <span className="truncate">Create “{query.trim()}”</span>
                                </OptionRow>
                            ) : (
                                <p className={cn('px-2 py-3 text-center', T.meta, INK.subtle)}>No labels yet</p>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {tags.map(tag => (
                                <CommandItem key={tag.id} value={tag.name} onSelect={() => toggle(tag.id)} className="gap-2.5">
                                    <Tag className={cn(ICON.md, INK.muted)} strokeWidth={1.75} />
                                    <span className="flex-1 truncate">{tag.name}</span>
                                    {selectedIds.has(tag.id) && <Check className={cn(ICON.md, INK.muted)} />}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Read-only ───────────────────────────────────────────────────────────────

export function SubtasksCell({ task }: { task: TaskTableTask }) {
    const all = task.subtasks ?? []
    if (all.length === 0) return null

    const done = all.filter(s => s.completed).length
    return (
        <span className={cn('flex items-center gap-2', T.meta, NUM, done === all.length ? 'text-emerald-600 dark:text-emerald-400' : INK.muted)}>
            <span className="h-1 w-8 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.09]" aria-hidden>
                <span
                    className={cn('block h-full rounded-full', done === all.length ? 'bg-emerald-500' : 'bg-foreground/60')}
                    style={{ width: `${(done / all.length) * 100}%` }}
                />
            </span>
            {done}/{all.length}
        </span>
    )
}

export function CreatedCell({ task }: { task: TaskTableTask }) {
    const created = new Date(task.createdAt)
    if (Number.isNaN(created.getTime())) return null
    return (
        <span className={cn(T.meta, NUM, INK.muted)} title={format(created, 'PPpp')}>
            {format(created, created.getFullYear() === new Date().getFullYear() ? 'd MMM' : 'd MMM yyyy')}
        </span>
    )
}
