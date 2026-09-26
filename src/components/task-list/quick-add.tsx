'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Flag, Plus, Repeat, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseTaskNaturalLanguage } from '@/lib/parsers/task-parser'
import { PRIORITIES } from '@/components/task-table/cells'
import { useTaskTable } from '@/components/task-table/context'
import type { NewTask } from '@/components/task-table/use-task-actions'
import type { TaskTableTag } from '@/components/task-table/types'
import { FOCUS, HOVER, ICON, INK, R, T, TRANSITION } from '@/lib/second-brain/ui'

const REPEAT_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' } as const

/** A recognised piece of the sentence, shown back so it's clear what was understood. */
function Chip({ icon: Icon, children, className }: { icon: typeof Calendar; children: React.ReactNode; className?: string }) {
    return (
        <span className={cn('inline-flex h-5 items-center gap-1 px-1.5', R.sm, 'bg-black/[0.045] dark:bg-white/[0.07]', T.meta, INK.default, className)}>
            <Icon className={ICON.sm} strokeWidth={2} />
            {children}
        </span>
    )
}

/**
 * The "+ Add task" line at the end of a section.
 *
 * Understands the same shorthand as the rest of the app — "Call Sam tomorrow 3pm
 * p1 @work every monday" — and shows what it picked up as it's typed, so nothing
 * lands with a surprise date. Stays open after each add, so a list goes in
 * without reaching for the mouse; Escape or clicking away closes it.
 */
export function QuickAdd({
    sectionId,
    onAdd,
    open,
    onOpenChange,
}: {
    sectionId: string | null
    onAdd: (task: NewTask) => void
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { tags, createTag } = useTaskTable()
    const [text, setText] = useState('')

    // Parsed on every keystroke; chrono is fast and the input is one line.
    const parsed = useMemo(
        () => (text.trim() ? parseTaskNaturalLanguage(text, { currentDate: new Date(), availableTags: tags }) : null),
        [text, tags]
    )

    const submit = async () => {
        if (!parsed) return
        const title = parsed.title.trim() || text.trim()
        setText('')

        // Labels that don't exist yet are created on the way in.
        const resolved: TaskTableTag[] = []
        for (const name of parsed.tagNames) {
            const known = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase())
            const tag = known ?? (await createTag(name))
            if (tag) resolved.push(tag)
        }

        onAdd({
            title,
            sectionId,
            dueDate: parsed.dueDate,
            priority: parsed.priority,
            tags: resolved,
            recurrence: parsed.recurrence,
        })
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => onOpenChange(true)}
                className={cn(
                    'group/add flex h-9 w-full items-center gap-2.5 pl-1 pr-2 text-left', R.md, T.body, INK.subtle,
                    HOVER, TRANSITION.fast, 'hover:text-foreground', FOCUS
                )}
            >
                <span className="flex h-7 w-7 items-center justify-center">
                    <Plus className={ICON.md} strokeWidth={2} />
                </span>
                Add task
            </button>
        )
    }

    const priority = PRIORITIES.find(p => p.value === parsed?.priority)

    return (
        <div className={cn('flex flex-col gap-1.5 py-1.5 pl-1 pr-2', R.md, 'bg-black/[0.02] dark:bg-white/[0.025]')}>
            <div className="flex h-7 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <Plus className={cn(ICON.md, INK.subtle)} strokeWidth={2} />
                </span>
                <input
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            void submit()
                        }
                        if (e.key === 'Escape') {
                            e.stopPropagation()
                            setText('')
                            onOpenChange(false)
                        }
                    }}
                    onBlur={() => {
                        if (text.trim()) void submit()
                        onOpenChange(false)
                    }}
                    placeholder="Task name — try “Draft post tomorrow 3pm p2 @writing”"
                    aria-label="New task"
                    maxLength={500}
                    className={cn('min-w-0 flex-1 bg-transparent outline-none', T.body, INK.strong, 'placeholder:text-muted-foreground/50')}
                />
            </div>

            {parsed && (parsed.dueDate || priority || parsed.tagNames.length > 0 || parsed.recurrence) && (
                <div className="flex flex-wrap items-center gap-1 pl-[38px]" aria-live="polite">
                    {parsed.dueDate && (
                        <Chip icon={Calendar}>
                            {format(parsed.dueDate, parsed.dueDate.getHours() || parsed.dueDate.getMinutes() ? 'EEE d MMM, h:mm a' : 'EEE d MMM')}
                        </Chip>
                    )}
                    {priority && (
                        <Chip icon={Flag} className={cn(priority.color, '[&>svg]:fill-current')}>{priority.label}</Chip>
                    )}
                    {parsed.tagNames.map(name => <Chip key={name} icon={Tag}>{name}</Chip>)}
                    {parsed.recurrence && <Chip icon={Repeat}>{REPEAT_LABEL[parsed.recurrence.interval]}</Chip>}
                </div>
            )}
        </div>
    )
}
