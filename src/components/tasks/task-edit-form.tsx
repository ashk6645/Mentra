'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Task } from '@prisma/client'
import { updateTask } from '@/lib/actions/tasks'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDebounce } from '@/hooks/use-debounce'
import { TagManager } from '@/components/tags/tag-manager'
import { getProjects } from '@/lib/actions/projects'
import { getTags } from '@/lib/actions/tags'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Flag, Check, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface TaskEditFormProps {
    task: any // Complex type with includes
}

export function TaskEditForm({ task }: TaskEditFormProps) {
    const router = useRouter()

    // State for fields
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [priority, setPriority] = useState<string | null>(task.priority)
    const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)
    const [projectId, setProjectId] = useState<string>(task.projectId || 'none')
    const [tagIds, setTagIds] = useState<string[]>(task.tags?.map((t: any) => t.tag.id) || [])

    // Available metadata
    const [projects, setProjects] = useState<any[]>([])
    const [tags, setTags] = useState<any[]>([])

    // Autosave status
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Debounce text inputs
    const debouncedTitle = useDebounce(title, 800)
    const debouncedDescription = useDebounce(description, 800)

    // Load available data
    useEffect(() => {
        Promise.all([getProjects(), getTags()]).then(([p, t]) => {
            setProjects(p)
            setTags(t)
        })
    }, [])

    // Reset state when task changes
    useEffect(() => {
        setTitle(task.title)
        setDescription(task.description || '')
        setPriority(task.priority)
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
        setProjectId(task.projectId || 'none')
        setTagIds(task.tags?.map((t: any) => t.tag.id) || [])
        setLastSaved(null)
    }, [task.id]) // Re-run when task ID switches

    // Generic update handler
    const handleUpdate = useCallback(async (data: any) => {
        setSaving(true)
        try {
            await updateTask({ id: task.id, ...data })
            setLastSaved(new Date())
            router.refresh()
        } catch (error) {
            console.error('Failed to autosave task:', error)
        } finally {
            setSaving(false)
        }
    }, [task.id, router])

    // Effect for debounced text updates
    // Use a ref to track if this is the initial mount to avoid saving on load
    const isMounted = useRef(false)

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true
            return
        }

        // Only save if dirty (simple check against current task props isn't perfect but good enough for now)
        if (debouncedTitle !== task.title) {
            handleUpdate({ title: debouncedTitle })
        }
    }, [debouncedTitle, task.title, handleUpdate])

    useEffect(() => {
        if (!isMounted.current) return
        if (debouncedDescription !== (task.description || '')) {
            handleUpdate({ description: debouncedDescription })
        }
    }, [debouncedDescription, task.description, handleUpdate])

    // Immediate updates for non-text fields
    const handlePriorityChange = (val: string) => {
        setPriority(val)
        handleUpdate({ priority: val as any })
    }

    const handleDueDateChange = (val: Date | undefined) => {
        setDueDate(val)
        handleUpdate({ dueDate: val ? val.toISOString() : null })
    }

    const handleProjectChange = (val: string) => {
        setProjectId(val)
        handleUpdate({ projectId: val === 'none' ? null : val })
    }

    const handleTagsChange = (newTagIds: string[]) => {
        setTagIds(newTagIds)
        handleUpdate({ tagIds: newTagIds })
    }

    return (
        <div className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-1">
                <Input
                    className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                />
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap gap-2">
                {/* Project */}
                <Select value={projectId} onValueChange={handleProjectChange}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/30 border-transparent hover:bg-muted/50">
                        <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Inbox</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Due Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 px-2 text-xs font-normal border-transparent bg-muted/30 hover:bg-muted/50 justify-start text-left w-[130px]",
                                !dueDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                            {dueDate ? format(dueDate, "PPP") : <span>No Due Date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dueDate}
                            onSelect={handleDueDateChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Priority */}
                <Select value={priority || 'low'} onValueChange={handlePriorityChange}>
                    <SelectTrigger className={cn("w-[110px] h-8 text-xs bg-muted/30 border-transparent hover:bg-muted/50")}>
                        <div className="flex items-center gap-2">
                            <Flag className={cn("h-3.5 w-3.5", {
                                'text-red-500 fill-red-500': priority === 'urgent',
                                'text-orange-500 fill-orange-500': priority === 'high',
                                'text-blue-500 fill-blue-500': priority === 'medium',
                                'text-muted-foreground': !priority || priority === 'low'
                            })} />
                            <span className="capitalize">{priority || 'Low'}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                <Textarea
                    className="min-h-[150px] resize-none border-none shadow-none p-0 focus-visible:ring-0 text-sm leading-relaxed bg-transparent"
                    placeholder="Add notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {/* Tags */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</label>
                <TagManager
                    selectedTagIds={tagIds}
                    onToggleTag={(tagId) => {
                        const newIds = tagIds.includes(tagId)
                            ? tagIds.filter(id => id !== tagId)
                            : [...tagIds, tagId]
                        handleTagsChange(newIds)
                    }}
                />
            </div>

            {/* Status Footer */}
            <div className="fixed bottom-0 right-0 w-[400px] xl:w-[450px] p-2 px-6 bg-background/80 backdrop-blur-sm border-t text-xs text-muted-foreground flex justify-end">
                {saving ? (
                    <span className="flex items-center text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        Saving...
                    </span>
                ) : lastSaved ? (
                    <span className="flex items-center text-green-600 transition-opacity duration-1000">
                        <Check className="h-3 w-3 mr-1.5" />
                        Saved
                    </span>
                ) : null}
            </div>
        </div>
    )
}
