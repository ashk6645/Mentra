'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CalendarIcon, Flag, Inbox, Clock, X, ChevronDown, Check, Bell, FolderKanban, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { RecurrenceSelector, RecurrenceValue } from '@/components/tasks/recurrence-selector'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export interface TaskEditorProps {
    availableTags?: { id: string; name: string }[]
    defaultProjectId?: string
    defaultSectionId?: string

    onCancel?: () => void
    onSubmit: (data: {
        title: string
        description?: string
        dueDate?: Date
        priority?: 'low' | 'medium' | 'high' | 'urgent' | null
        tagIds?: string[]
        scheduledTime?: string
        isRecurring?: boolean
        recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
        recurrenceStep?: number
        recurrenceDays?: number[]
        reminderPattern?: string
        projectId?: string
        sectionId?: string
    }) => void
    isSubmitting?: boolean
}

const priorities = [
    { value: 'low', label: 'Low', color: 'text-slate-500', fill: 'fill-slate-500' },
    { value: 'medium', label: 'Medium', color: 'text-blue-500', fill: 'fill-blue-500' },
    { value: 'high', label: 'High', color: 'text-orange-500', fill: 'fill-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', fill: 'fill-red-600' },
] as const

export function TaskEditor({
    availableTags = [],
    defaultProjectId,
    defaultSectionId,
    onCancel,
    onSubmit,
    isSubmitting = false
}: TaskEditorProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [time, setTime] = useState<string>('')
    const [priority, setPriority] = useState<string | null>(null)
    const [recurrence, setRecurrence] = useState<{
        interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
        step?: number
        days?: number[]
    } | undefined>(undefined)
    const [reminderPattern, setReminderPattern] = useState<string | undefined>(undefined)
    const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId)
    const [sectionId, setSectionId] = useState<string | undefined>(defaultSectionId)
    const [availableProjects, setAvailableProjects] = useState<{ id: string; name: string; icon: string | null; color: string }[]>([])
    const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])

    // Clean title for submission (without tags/dates)
    const [parsedTitle, setParsedTitle] = useState('')

    // Auto-focus title on mount
    const titleInputRef = useRef<HTMLInputElement>(null)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (titleInputRef.current) {
            titleInputRef.current.focus()
        }
    }, [])

    // Fetch projects on mount
    useEffect(() => {
        async function fetchProjects() {
            const { getProjects } = await import('@/lib/actions/projects')
            const result = await getProjects()
            if (result.success && result.data) {
                setAvailableProjects(result.data)
            }
        }
        fetchProjects()
    }, [])

    // Fetch sections when project changes
    useEffect(() => {
        if (projectId) {
            async function fetchSections() {
                const { getSections } = await import('@/lib/actions/sections')
                const result = await getSections(projectId!)
                if (result.success && result.data) {
                    setAvailableSections(result.data)
                }
            }
            fetchSections()
        } else {
            setAvailableSections([])
            setSectionId(undefined)
        }
    }, [projectId])

    const handleTitleChange = (newVal: string) => {
        setTitle(newVal)
        setParsedTitle(newVal) // Default to raw if no parsing happens

        // Simple debounce for parsing
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(async () => {
            try {
                // Dynamic import to parse
                const { parseTaskNaturalLanguage } = await import('@/lib/parsers/task-parser')

                const parsed = parseTaskNaturalLanguage(newVal, {
                    currentDate: new Date(),
                    availableTags: availableTags,
                })

                setParsedTitle(parsed.title)

                if (parsed.dueDate) setDate(parsed.dueDate)
                if (parsed.priority) setPriority(parsed.priority)
                if (parsed.recurrence) setRecurrence(parsed.recurrence)
                if (parsed.reminderPattern) setReminderPattern(parsed.reminderPattern)
            } catch (err) {
                console.error("Parsing error", err)
            }
        }, 500)
    }

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!title.trim()) return



        onSubmit({
            title: parsedTitle || title, // Use parsed title if available
            description,
            dueDate: date,
            scheduledTime: time || undefined,
            priority: priority as any,
            isRecurring: !!recurrence,
            recurrenceInterval: recurrence?.interval,
            recurrenceStep: recurrence?.step,
            recurrenceDays: recurrence?.days,
            reminderPattern,
            projectId,
            sectionId,
        })
    }


    const selectedPriority = priorities.find(p => p.value === priority)

    return (
        <div className="flex flex-col w-full bg-background border rounded-lg shadow-sm overflow-hidden">
            <div className="p-2 space-y-2">
                {/* Title Input */}
                <input
                    ref={titleInputRef}
                    className="w-full bg-transparent text-base font-semibold placeholder:text-muted-foreground/60 focus:outline-none"
                    placeholder="Task name"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                        }
                    }}
                />

                {/* Description Input */}
                <Textarea
                    className="w-full min-h-[24px] bg-transparent dark:bg-transparent border-none dark:border-none shadow-none pl-1 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-foreground text-sm"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                {/* Attributes Row */}
                <div className="flex items-center gap-2 pt-2">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-8 px-2 text-xs font-normal border-dashed",
                                    date && "text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                                )}
                            >
                                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                                {date ? format(date, "MMM d") : "Due date"}
                                {date && (
                                    <div
                                        role="button"
                                        className="ml-1.5 hover:bg-red-100 rounded-full p-0.5 group"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDate(undefined)
                                        }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation()
                                        }}
                                    >
                                        <X className="h-3 w-3 text-green-600 group-hover:text-red-600" />
                                    </div>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden shadow-xl border border-border/40" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                            <div className="p-3 border-t border-border/40 bg-muted/10">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase ml-1">Time</label>
                                    <div className="flex items-center gap-2 group">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground ml-1 group-focus-within:text-foreground transition-colors" />
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="h-7 text-[13px] bg-transparent border-transparent hover:border-border hover:bg-muted/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all w-full rounded-md px-2 shadow-none"
                                        />
                                    </div>
                                </div>
                                {(date || time) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setDate(undefined);
                                            setTime('');
                                        }}
                                        className="w-full text-xs h-7 mt-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                    >
                                        Clear date & time
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Priority Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-8 px-2 text-xs font-normal border-dashed",
                                    priority && "border-solid"
                                )}
                            >
                                <Flag className={cn("mr-1.5 h-3.5 w-3.5", selectedPriority?.color || "text-muted-foreground")} fill={selectedPriority?.value ? "currentColor" : "none"} />
                                {selectedPriority ? selectedPriority.label : "Priority"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {priorities.map((p) => (
                                <DropdownMenuItem
                                    key={p.value}
                                    onClick={() => setPriority(p.value)}
                                    className="gap-2"
                                >
                                    <Flag className={cn("h-4 w-4", p.color)} fill="currentColor" />
                                    <span>{p.label}</span>
                                    {priority === p.value && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            ))}
                            {priority && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPriority(null)}>
                                        Clear Priority
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>


                    {/* Recurrence Selector */}
                    <RecurrenceSelector
                        value={recurrence}
                        onChange={(val) => setRecurrence(val)}
                    />

                    {/* Reminder Badge */}
                    {reminderPattern && (
                        <div className="flex items-center gap-1.5 px-2 h-8 text-xs font-medium border border-purple-200 bg-purple-50 text-purple-700 rounded-md dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            <Bell className="h-3.5 w-3.5" />
                            <span>{reminderPattern}</span>
                            <X
                                className="h-3 w-3 hover:text-purple-900 cursor-pointer"
                                onClick={() => setReminderPattern(undefined)}
                            />
                        </div>
                    )}

                    {/* Project Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-8 px-2 text-xs font-normal border-dashed",
                                    projectId && "border-solid"
                                )}
                            >
                                <FolderKanban className="mr-1.5 h-3.5 w-3.5" />
                                {projectId
                                    ? `${availableProjects.find(p => p.id === projectId)?.icon || '📁'} ${availableProjects.find(p => p.id === projectId)?.name || 'Project'}`
                                    : "Project"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                            {availableProjects.map((project) => (
                                <DropdownMenuItem
                                    key={project.id}
                                    onClick={() => setProjectId(project.id)}
                                    className="gap-2"
                                >
                                    <span>{project.icon || '📁'}</span>
                                    <span>{project.name}</span>
                                    {projectId === project.id && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            ))}
                            {projectId && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setProjectId(undefined)}>
                                        Clear Project
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Section Selector (only show if project selected) */}
                    {projectId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-2 text-xs font-normal border-dashed",
                                        sectionId && "border-solid"
                                    )}
                                >
                                    <Layers className="mr-1.5 h-3.5 w-3.5" />
                                    {sectionId
                                        ? availableSections.find(s => s.id === sectionId)?.name || 'Section'
                                        : "Section"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                                {availableSections.length === 0 ? (
                                    <div className="px-2 py-4 text-xs text-center text-muted-foreground">
                                        No sections in this project
                                    </div>
                                ) : (
                                    availableSections.map((section) => (
                                        <DropdownMenuItem
                                            key={section.id}
                                            onClick={() => setSectionId(section.id)}
                                            className="gap-2"
                                        >
                                            <span>{section.name}</span>
                                            {sectionId === section.id && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                    ))
                                )}
                                {sectionId && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setSectionId(undefined)}>
                                            Clear Section
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Natural Language Tips */}
                <div className="pt-2 text-[10px] text-muted-foreground/60 select-none">
                    Use <span className="font-mono">@tag</span>, <span className="font-mono">p1-4</span>, <span className="font-mono">!reminder</span>, or type dates like <span className="font-mono">"tomorrow at 3pm"</span>.
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">


                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="h-8 bg-muted/50 hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => handleSubmit()}
                        disabled={!title.trim() || isSubmitting}
                        className={cn(
                            "h-8 px-4 font-semibold",
                            !title.trim() && "opacity-50"
                        )}
                    >
                        Add task
                    </Button>
                </div>
            </div>
        </div>
    )
}