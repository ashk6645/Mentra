'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CalendarIcon, Flag, Inbox, Clock, X, ChevronDown, Check } from 'lucide-react'
import { format } from 'date-fns'

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
    projects: { id: string; name: string }[]
    availableTags?: { id: string; name: string }[]
    defaultProjectId?: string
    onCancel?: () => void
    onSubmit: (data: {
        title: string
        description?: string
        dueDate?: Date
        priority?: 'low' | 'medium' | 'high' | 'urgent' | null
        projectId?: string
        tagIds?: string[]
        scheduledTime?: string
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
    projects,
    availableTags = [],
    defaultProjectId,
    onCancel,
    onSubmit,
    isSubmitting = false
}: TaskEditorProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [priority, setPriority] = useState<string | null>(null)
    const [projectId, setProjectId] = useState<string>(defaultProjectId || 'inbox')

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
                    availableProjects: projects,
                    availableTags: availableTags,
                })

                setParsedTitle(parsed.title)

                if (parsed.dueDate) setDate(parsed.dueDate)
                if (parsed.priority) setPriority(parsed.priority)
                if (parsed.projectName) {
                    const p = projects.find(proj => proj.name.toLowerCase() === parsed.projectName?.toLowerCase())
                    if (p) setProjectId(p.id)
                }
            } catch (err) {
                console.error("Parsing error", err)
            }
        }, 500)
    }

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!title.trim()) return

        // Verify projectId is valid (exists in projects list) or is 'inbox'
        const isValidProject = projectId === 'inbox' || projects.some(p => p.id === projectId)
        const finalProjectId = isValidProject ? (projectId === 'inbox' ? undefined : projectId) : undefined

        onSubmit({
            title: parsedTitle || title, // Use parsed title if available
            description,
            dueDate: date,
            priority: priority as any,
            projectId: finalProjectId,
        })
    }

    const currentProject = projects.find(p => p.id === projectId)
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
                    className="w-full min-h-[24px] bg-transparent border-none p-0 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/60 text-sm"
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
                                {date && <X className="ml-1.5 h-3 w-3 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setDate(undefined) }} />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
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

                    {/* Reminders / More (Placeholder for now) */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

                {/* Natural Language Tips */}
                <div className="pt-2 text-[10px] text-muted-foreground/60 select-none">
                    Use <span className="font-mono">#project</span>, <span className="font-mono">@tag</span>, <span className="font-mono">p1-4</span>, <span className="font-mono">!reminder</span>, or type dates like <span className="font-mono">"tomorrow at 3pm"</span>.
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                {/* Project Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
                            <Inbox className="h-4 w-4" />
                            <span className="max-w-[100px] truncate">
                                {currentProject ? currentProject.name : "Inbox"}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                        <DropdownMenuItem onClick={() => setProjectId('inbox')}>
                            <Inbox className="mr-2 h-4 w-4" />
                            Inbox
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {projects.map((p) => (
                            <DropdownMenuItem key={p.id} onClick={() => setProjectId(p.id)}>
                                {p.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

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
                            !title.trim() ? "opacity-50" : "bg-[#db4c3f] hover:bg-[#b03d32] text-white" // Todoist red-ish color
                        )}
                    >
                        Add task
                    </Button>
                </div>
            </div>
        </div>
    )
}
