'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, isToday, isTomorrow, nextMonday, startOfDay } from 'date-fns'
import { Calendar, Check, Clock, Flag, FolderKanban, Inbox, Layers, Loader2, Plus, Tag, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { RecurrenceSelector, type RecurrenceValue } from '@/components/tasks/recurrence-selector'
import { cn } from '@/lib/utils'
import { updateTask, type UpdateTaskInput } from '@/lib/actions/tasks'
import { createTag, getTags } from '@/lib/actions/tags'
import { getProjects } from '@/lib/actions/projects'
import { getSections } from '@/lib/actions/sections'
import { OptionRow, POPOVER, Property, Section, ValueButton, saveFailed, useApplyTaskUpdate } from './parts'
import { FIELD_FOCUS, HAIRLINE, ICON, INK, R, T, TRANSITION } from '@/lib/second-brain/ui'

type Priority = 'urgent' | 'high' | 'medium' | 'low'

/** Colour is kept for priority alone: it is the one property you scan a list for. */
const PRIORITIES: { value: Priority; label: string; color: string }[] = [
    { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'medium', label: 'Medium', color: 'text-blue-500' },
    { value: 'low', label: 'Low', color: 'text-muted-foreground' },
]

interface TaskTag {
    tag?: { id: string; name: string; color?: string | null }
    id?: string
}

interface PropertiesTask {
    id: string
    dueDate?: Date | string | null
    priority?: string | null
    tags?: TaskTag[]
    scheduledStart?: Date | string | null
    durationMinutes?: number | null
    isRecurring?: boolean
    recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
    recurrenceStep?: number | null
    recurrenceDays?: number[] | null
    projectId?: string | null
    sectionId?: string | null
    project?: { id: string; name: string; icon: string | null; color: string } | null
    section?: { id: string; name: string } | null
}

interface NamedItem {
    id: string
    name: string
}

const toDate = (value: Date | string | null | undefined) => (value ? new Date(value) : null)

/** "HH:mm" from a task's scheduled start, or from a due date that carries a time. */
function timeOf(task: PropertiesTask): string {
    if (task.scheduledStart) return format(new Date(task.scheduledStart), 'HH:mm')
    const due = toDate(task.dueDate)
    return due && (due.getHours() !== 0 || due.getMinutes() !== 0) ? format(due, 'HH:mm') : ''
}

function dateLabel(date: Date | null, time: string): string {
    if (!date) return 'No date'
    const day = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE, d MMM')
    if (!time) return day
    const [h, m] = time.split(':').map(Number)
    return `${day}, ${format(new Date(2000, 0, 1, h, m), 'h:mm a')}`
}

/**
 * Due date, priority, repeat, project, section and labels — one row each.
 *
 * Every change is written as it's made, and succeeds silently: the new value on
 * screen is the confirmation. Only a failure says anything.
 */
export function TaskMetadataRow({ task, isReadOnly = false }: { task: PropertiesTask; isReadOnly?: boolean }) {
    const router = useRouter()
    const apply = useApplyTaskUpdate(task)
    const [isPending, startTransition] = useTransition()

    const [dueDate, setDueDate] = useState<Date | null>(() => toDate(task.dueDate))
    const [time, setTime] = useState(() => timeOf(task))
    const [priority, setPriority] = useState<string>(task.priority || 'none')
    const [projectId, setProjectId] = useState<string | null>(task.projectId ?? null)
    const [sectionId, setSectionId] = useState<string | null>(task.sectionId ?? null)
    const [tagIds, setTagIds] = useState<string[]>(
        () => (task.tags?.map(t => t.tag?.id || t.id).filter(Boolean) as string[]) ?? []
    )

    // Follow changes made elsewhere (AI suggestions, the store settling after a
    // save) by adjusting during render, as React recommends over a syncing effect.
    const [seen, setSeen] = useState(task)
    if (seen !== task) {
        setSeen(task)
        setDueDate(toDate(task.dueDate))
        setTime(timeOf(task))
        setPriority(task.priority || 'none')
        setProjectId(task.projectId ?? null)
        setSectionId(task.sectionId ?? null)
        setTagIds((task.tags?.map(t => t.tag?.id || t.id).filter(Boolean) as string[]) ?? [])
    }

    const [projects, setProjects] = useState<(NamedItem & { icon: string | null; color: string })[]>([])
    const [sections, setSections] = useState<NamedItem[]>([])
    const [tags, setTags] = useState<(NamedItem & { color?: string | null })[]>([])

    const [dateOpen, setDateOpen] = useState(false)
    const [labelsOpen, setLabelsOpen] = useState(false)
    const [labelQuery, setLabelQuery] = useState('')

    useEffect(() => {
        let live = true
        getTags().then(result => live && setTags(result))
        getProjects().then(result => live && result.success && result.data && setProjects(result.data))
        return () => {
            live = false
        }
    }, [])

    useEffect(() => {
        if (!projectId) return
        let live = true
        getSections(projectId).then(result => live && result.success && result.data && setSections(result.data))
        return () => {
            live = false
        }
    }, [projectId])

    /** Save a patch; on failure, run `revert` and say so. */
    const save = (what: string, patch: Omit<UpdateTaskInput, 'id'>, revert: () => void, extra: object = {}) => {
        startTransition(async () => {
            const result = await updateTask({ id: task.id, ...patch })
            if (!result.success) {
                revert()
                saveFailed(what, result.error)
                return
            }
            apply(result.data, extra)
            router.refresh()
        })
    }

    // ─── Date and time ───────────────────────────────────────────────────────

    const setDate = (next: Date | null) => {
        const previous = { dueDate, time }
        setDueDate(next)
        setDateOpen(false)

        const patch: Omit<UpdateTaskInput, 'id'> = { dueDate: next ? next.toISOString() : null }

        if (!next) {
            // No date means no time either.
            setTime('')
            patch.scheduledStart = null
            patch.scheduledEnd = null
        } else if (time) {
            // Keep the time of day when moving to another date.
            const [h, m] = time.split(':').map(Number)
            const start = new Date(next)
            start.setHours(h, m, 0, 0)
            patch.dueDate = start.toISOString()
            patch.scheduledStart = start.toISOString()
            patch.scheduledEnd = new Date(start.getTime() + (task.durationMinutes || 30) * 60_000).toISOString()
        }

        save('the date', patch, () => {
            setDueDate(previous.dueDate)
            setTime(previous.time)
        })
    }

    const saveTime = (value: string) => {
        if (!dueDate || value === timeOf(task)) return

        if (!value) {
            const day = startOfDay(dueDate)
            save('the time', { dueDate: day.toISOString(), scheduledStart: null, scheduledEnd: null }, () => setTime(timeOf(task)))
            return
        }

        const [h, m] = value.split(':').map(Number)
        const start = new Date(dueDate)
        start.setHours(h, m, 0, 0)
        save(
            'the time',
            {
                dueDate: start.toISOString(),
                scheduledStart: start.toISOString(),
                scheduledEnd: new Date(start.getTime() + (task.durationMinutes || 30) * 60_000).toISOString(),
            },
            () => setTime(timeOf(task))
        )
    }

    // ─── Everything else ─────────────────────────────────────────────────────

    const choosePriority = (next: string) => {
        const previous = priority
        setPriority(next)
        save('the priority', { priority: next === 'none' ? null : (next as Priority) }, () => setPriority(previous))
    }

    const chooseProject = (next: string | null) => {
        if (next === projectId) return
        const previous = { projectId, sectionId }
        setProjectId(next)
        setSectionId(null)
        setSections([])
        const project = projects.find(p => p.id === next) ?? null
        save(
            'the project',
            { projectId: next, sectionId: null },
            () => {
                setProjectId(previous.projectId)
                setSectionId(previous.sectionId)
            },
            { projectId: next, project, sectionId: null, section: null }
        )
    }

    const chooseSection = (next: string | null) => {
        if (next === sectionId) return
        const previous = sectionId
        setSectionId(next)
        save('the section', { sectionId: next }, () => setSectionId(previous), {
            sectionId: next,
            section: sections.find(s => s.id === next) ?? null,
        })
    }

    const toggleTag = (tagId: string) => {
        const previous = tagIds
        const next = tagIds.includes(tagId) ? tagIds.filter(id => id !== tagId) : [...tagIds, tagId]
        setTagIds(next)
        save('labels', { tagIds: next }, () => setTagIds(previous))
    }

    const addLabel = () => {
        const name = labelQuery.trim()
        if (!name) return
        startTransition(async () => {
            const result = await createTag({ name, color: 'bg-slate-500' })
            if (!result.success || !result.data) {
                saveFailed('labels', 'The label couldn’t be created.')
                return
            }
            const created = result.data
            setTags(prev => [...prev, created])
            setLabelQuery('')
            toggleTag(created.id)
        })
    }

    const setRepeat = (value?: RecurrenceValue) => {
        save('the repeat', {
            isRecurring: !!value,
            recurrenceInterval: value?.interval,
            recurrenceStep: value?.step,
            recurrenceDays: value?.days,
        }, () => {})
    }

    const selectedPriority = PRIORITIES.find(p => p.value === priority)
    const project = projects.find(p => p.id === projectId) ?? (task.project?.id === projectId ? task.project : null)
    const section = sections.find(s => s.id === sectionId) ?? (task.section?.id === sectionId ? task.section : null)
    const selectedTags = tagIds
        .map(id => tags.find(t => t.id === id) ?? task.tags?.find(t => (t.tag?.id || t.id) === id)?.tag)
        .filter((t): t is NamedItem => !!t)

    const today = startOfDay(new Date())
    const quickDates = [
        { label: 'Today', date: today },
        { label: 'Tomorrow', date: addDays(today, 1) },
        { label: 'Next week', date: nextMonday(today) },
    ]

    return (
        <Section
            title="Properties"
            meta={isPending ? <Loader2 className={cn(ICON.sm, 'animate-spin', INK.subtle)} aria-label="Saving" /> : null}
        >
            <div className="flex flex-col gap-0.5">
                {/* Due date */}
                <Property label="Due date">
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild disabled={isReadOnly}>
                            <ValueButton icon={Calendar} empty={!dueDate} disabled={isReadOnly}>
                                {dateLabel(dueDate, time)}
                            </ValueButton>
                        </PopoverTrigger>
                        <PopoverContent align="start" className={cn(POPOVER, 'w-auto p-0')}>
                            <div className={cn('grid grid-cols-3 gap-1 border-b p-2', HAIRLINE)}>
                                {quickDates.map(q => (
                                    <button
                                        key={q.label}
                                        type="button"
                                        onClick={() => setDate(q.date)}
                                        className={cn(
                                            'h-7 px-2', R.md, T.meta, 'font-medium', INK.default, TRANSITION.fast,
                                            'bg-black/[0.035] hover:bg-black/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.09]'
                                        )}
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                            <CalendarPicker
                                mode="single"
                                selected={dueDate ?? undefined}
                                onSelect={date => setDate(date ?? null)}
                                initialFocus
                            />
                            <div className={cn('flex items-center gap-2 border-t p-2', HAIRLINE)}>
                                <Clock className={cn(ICON.md, 'ml-1 shrink-0', INK.muted)} strokeWidth={1.75} />
                                <input
                                    type="time"
                                    value={time}
                                    disabled={!dueDate}
                                    onChange={e => setTime(e.target.value)}
                                    onBlur={e => saveTime(e.target.value)}
                                    aria-label="Time"
                                    className={cn(
                                        'h-8 flex-1 border bg-transparent px-2 tabular-nums', R.md, HAIRLINE, T.body, INK.strong,
                                        '[color-scheme:light] dark:[color-scheme:dark] disabled:opacity-40', TRANSITION.fast, FIELD_FOCUS
                                    )}
                                />
                                {dueDate && (
                                    <button
                                        type="button"
                                        onClick={() => setDate(null)}
                                        className={cn('h-8 px-2.5', R.md, T.meta, 'font-medium', INK.muted, TRANSITION.fast,
                                            'hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]')}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </Property>

                {/* Priority */}
                <Property label="Priority">
                    <Popover>
                        <PopoverTrigger asChild disabled={isReadOnly}>
                            <ValueButton
                                icon={Flag}
                                empty={!selectedPriority}
                                disabled={isReadOnly}
                                iconClassName={cn(selectedPriority?.color, selectedPriority && 'fill-current opacity-100')}
                            >
                                {selectedPriority?.label ?? 'None'}
                            </ValueButton>
                        </PopoverTrigger>
                        <PopoverContent align="start" className={cn(POPOVER, 'w-44')}>
                            {PRIORITIES.map(p => (
                                <OptionRow key={p.value} selected={priority === p.value} onSelect={() => choosePriority(p.value)}>
                                    <Flag className={cn(ICON.md, p.color, 'fill-current')} strokeWidth={1.75} />
                                    <span className="flex-1">{p.label}</span>
                                    {priority === p.value && <Check className={cn(ICON.md, INK.muted)} />}
                                </OptionRow>
                            ))}
                            <div className={cn('my-1 border-t', HAIRLINE)} />
                            <OptionRow selected={priority === 'none'} onSelect={() => choosePriority('none')}>
                                <Flag className={cn(ICON.md, INK.subtle)} strokeWidth={1.75} />
                                <span className={cn('flex-1', INK.muted)}>None</span>
                                {priority === 'none' && <Check className={cn(ICON.md, INK.muted)} />}
                            </OptionRow>
                        </PopoverContent>
                    </Popover>
                </Property>

                {/* Repeat */}
                <Property label="Repeat">
                    {isReadOnly ? (
                        <ValueButton disabled empty={!task.isRecurring}>{task.isRecurring ? 'Repeats' : 'Doesn’t repeat'}</ValueButton>
                    ) : (
                        <RecurrenceSelector
                            // Restyled to match the other values; the component's own
                            // outlined-chip look would be the only box on the panel.
                            className={cn(
                                '-ml-2 h-8 gap-2 border-transparent bg-transparent px-2 font-normal shadow-none', T.body,
                                'hover:border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                                task.isRecurring ? INK.strong : INK.subtle
                            )}
                            value={
                                task.isRecurring && task.recurrenceInterval
                                    ? { interval: task.recurrenceInterval, step: task.recurrenceStep || 1, days: task.recurrenceDays ?? [] }
                                    : undefined
                            }
                            onChange={setRepeat}
                        />
                    )}
                </Property>

                {/* Project */}
                <Property label="Project">
                    <Popover>
                        <PopoverTrigger asChild disabled={isReadOnly}>
                            <ValueButton icon={project ? undefined : Inbox} empty={!project} disabled={isReadOnly}>
                                {project ? `${project.icon || '📁'}  ${project.name}` : 'Inbox'}
                            </ValueButton>
                        </PopoverTrigger>
                        <PopoverContent align="start" className={cn(POPOVER, 'max-h-72 w-56 overflow-y-auto')}>
                            <OptionRow selected={!projectId} onSelect={() => chooseProject(null)}>
                                <Inbox className={cn(ICON.md, INK.muted)} strokeWidth={1.75} />
                                <span className="flex-1">Inbox</span>
                                {!projectId && <Check className={cn(ICON.md, INK.muted)} />}
                            </OptionRow>
                            {projects.length > 0 && <div className={cn('my-1 border-t', HAIRLINE)} />}
                            {projects.map(p => (
                                <OptionRow key={p.id} selected={projectId === p.id} onSelect={() => chooseProject(p.id)}>
                                    <span aria-hidden className="w-3.5 text-center">{p.icon || '📁'}</span>
                                    <span className="flex-1 truncate">{p.name}</span>
                                    {projectId === p.id && <Check className={cn(ICON.md, INK.muted)} />}
                                </OptionRow>
                            ))}
                        </PopoverContent>
                    </Popover>
                </Property>

                {/* Section — only meaningful inside a project */}
                {projectId && (
                    <Property label="Section">
                        <Popover>
                            <PopoverTrigger asChild disabled={isReadOnly}>
                                <ValueButton icon={Layers} empty={!section} disabled={isReadOnly}>
                                    {section?.name ?? 'No section'}
                                </ValueButton>
                            </PopoverTrigger>
                            <PopoverContent align="start" className={cn(POPOVER, 'max-h-72 w-56 overflow-y-auto')}>
                                <OptionRow selected={!sectionId} onSelect={() => chooseSection(null)}>
                                    <FolderKanban className={cn(ICON.md, INK.muted)} strokeWidth={1.75} />
                                    <span className={cn('flex-1', INK.muted)}>No section</span>
                                    {!sectionId && <Check className={cn(ICON.md, INK.muted)} />}
                                </OptionRow>
                                {sections.length > 0 && <div className={cn('my-1 border-t', HAIRLINE)} />}
                                {sections.map(s => (
                                    <OptionRow key={s.id} selected={sectionId === s.id} onSelect={() => chooseSection(s.id)}>
                                        <Layers className={cn(ICON.md, INK.muted)} strokeWidth={1.75} />
                                        <span className="flex-1 truncate">{s.name}</span>
                                        {sectionId === s.id && <Check className={cn(ICON.md, INK.muted)} />}
                                    </OptionRow>
                                ))}
                            </PopoverContent>
                        </Popover>
                    </Property>
                )}

                {/* Labels */}
                <Property label="Labels">
                    {selectedTags.map(tag => (
                        <span
                            key={tag.id}
                            className={cn(
                                'inline-flex h-6 items-center gap-1 border pl-2', isReadOnly ? 'pr-2' : 'pr-1', R.sm, HAIRLINE,
                                T.meta, INK.default
                            )}
                        >
                            {tag.name}
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    aria-label={`Remove ${tag.name}`}
                                    className={cn('flex h-4 w-4 items-center justify-center rounded-[4px]', INK.subtle, TRANSITION.fast,
                                        'hover:bg-black/[0.06] hover:text-foreground dark:hover:bg-white/[0.08]')}
                                >
                                    <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                                </button>
                            )}
                        </span>
                    ))}

                    {!isReadOnly && (
                        <Popover open={labelsOpen} onOpenChange={open => {
                            setLabelsOpen(open)
                            if (!open) setLabelQuery('')
                        }}>
                            <PopoverTrigger asChild>
                                <ValueButton
                                    icon={selectedTags.length === 0 ? Tag : Plus}
                                    empty
                                    className={selectedTags.length > 0 ? 'ml-0 h-6 px-1.5' : undefined}
                                    aria-label="Add label"
                                >
                                    {selectedTags.length === 0 ? 'Add label' : null}
                                </ValueButton>
                            </PopoverTrigger>
                            <PopoverContent align="start" className={cn(POPOVER, 'w-56 p-0')}>
                                <Command>
                                    <CommandInput placeholder="Find or create…" value={labelQuery} onValueChange={setLabelQuery} />
                                    <CommandList>
                                        <CommandEmpty className="p-1">
                                            {labelQuery.trim() ? (
                                                <OptionRow onSelect={addLabel}>
                                                    <Plus className={cn(ICON.md, INK.muted)} />
                                                    <span className="truncate">Create “{labelQuery.trim()}”</span>
                                                </OptionRow>
                                            ) : (
                                                <p className={cn('px-2 py-3 text-center', T.meta, INK.subtle)}>No labels yet</p>
                                            )}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {tags.map(tag => (
                                                <CommandItem key={tag.id} onSelect={() => toggleTag(tag.id)} className="gap-2.5">
                                                    <Tag className={cn(ICON.md, INK.muted)} strokeWidth={1.75} />
                                                    <span className="flex-1 truncate">{tag.name}</span>
                                                    {tagIds.includes(tag.id) && <Check className={cn(ICON.md, INK.muted)} />}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}

                    {isReadOnly && selectedTags.length === 0 && (
                        <span className={cn(T.body, INK.subtle)}>None</span>
                    )}
                </Property>
            </div>
        </Section>
    )
}
