'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CalendarIcon, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TagManager } from '@/components/tags/tag-manager'
import { Plus, X, Check, Trash2 } from 'lucide-react'
import { createSubtask, updateSubtask, deleteSubtask } from '@/lib/actions/subtasks'
import { Subtask } from '@prisma/client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { updateTask } from '@/lib/actions/tasks'
import { getTags } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import { Tag, Task } from '@prisma/client'

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
    dueDate: z.date().optional().nullable(),
    scheduledTime: z.string().optional(),
    durationMinutes: z.number().optional(),

    tagIds: z.array(z.string()).optional(),
})

interface EditTaskDialogProps {
    task: Task & { tags?: { tag: { id: string } }[], subtasks?: Subtask[] }
    trigger?: React.ReactNode
}

export function EditTaskDialog({ task, trigger }: EditTaskDialogProps) {
    const [open, setOpen] = useState(false)

    const [tags, setTags] = useState<Tag[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()

    // Extract time from scheduledStart if it exists
    const getScheduledTime = () => {
        if (!task.scheduledStart) return ''
        const date = new Date(task.scheduledStart)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: task.title,
            description: task.description || '',
            priority: task.priority as any,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,

            tagIds: task.tags?.map(t => t.tag.id) || [],
            scheduledTime: getScheduledTime(),
            durationMinutes: task.durationMinutes || 30,
        },
    })


    useEffect(() => {
        if (open) {
            getTags().then((t) => {
                setTags(t)
            })
            // Reset subtasks state from props when opening
            if (task.subtasks) {
                setLocalSubtasks(task.subtasks)
            }
        }
    }, [open, task.subtasks])

    // Subtask State & Handlers
    const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>(task.subtasks || [])
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [isAddingSubtask, setIsAddingSubtask] = useState(false)

    async function handleAddSubtask(e: React.FormEvent) {
        e.preventDefault()
        if (!newSubtaskTitle.trim()) return

        const tempId = `temp-${Date.now()}`
        const optimsticSubtask: any = {
            id: tempId,
            taskId: task.id,
            title: newSubtaskTitle,
            completed: false,
            createdAt: new Date(),
            sortOrder: localSubtasks.length
        }

        setLocalSubtasks([...localSubtasks, optimsticSubtask])
        setNewSubtaskTitle('')
        setIsAddingSubtask(false) // Keep focus? Maybe not needed if we want to add multiple

        const res = await createSubtask(task.id, optimsticSubtask.title)
        if (res.success && res.data) {
            setLocalSubtasks(prev => prev.map(st => st.id === tempId ? res.data : st))
        } else {
            // Revert on failure
            setLocalSubtasks(prev => prev.filter(st => st.id !== tempId))
        }
    }

    async function handleToggleSubtask(subtaskId: string, completed: boolean) {
        setLocalSubtasks(prev => prev.map(st => st.id === subtaskId ? { ...st, completed } : st))
        await updateSubtask(subtaskId, { completed })
    }

    async function handleDeleteSubtask(subtaskId: string) {
        setLocalSubtasks(prev => prev.filter(st => st.id !== subtaskId))
        await deleteSubtask(subtaskId)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            // Calculate scheduledStart and scheduledEnd if date and time are provided
            let scheduledStart: string | undefined
            let scheduledEnd: string | undefined

            if (values.dueDate && values.scheduledTime) {
                const [hours, minutes] = values.scheduledTime.split(':').map(Number)
                const startDate = new Date(values.dueDate)
                startDate.setHours(hours, minutes, 0, 0)
                scheduledStart = startDate.toISOString()

                // Update dueDate to include the time component as well
                values.dueDate.setHours(hours, minutes, 0, 0)

                if (values.durationMinutes) {
                    const endDate = new Date(startDate.getTime() + values.durationMinutes * 60000)
                    scheduledEnd = endDate.toISOString()
                }
            }

            const result = await updateTask({
                id: task.id,
                ...values,
                dueDate: values.dueDate ? values.dueDate.toISOString() : null,
                scheduledStart,
                scheduledEnd,
            })

            if (result.success) {
                setOpen(false)
                router.refresh()
            }
        } catch (e) {
            console.error('Task update exception:', e)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="What needs to be done?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Add details..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Subtasks Section */}
                        <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium">Subtasks</FormLabel>
                                <span className="text-xs text-muted-foreground">
                                    {localSubtasks.filter(st => st.completed).length}/{localSubtasks.length}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {localSubtasks.map((subtask) => (
                                    <div key={subtask.id} className="flex items-center gap-2 group">
                                        <div
                                            className={cn(
                                                "h-4 w-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors",
                                                subtask.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50 hover:border-primary"
                                            )}
                                            onClick={() => handleToggleSubtask(subtask.id, !subtask.completed)}
                                        >
                                            {subtask.completed && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className={cn("text-sm flex-1", subtask.completed && "line-through text-muted-foreground")}>
                                            {subtask.title}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteSubtask(subtask.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Add a subtask..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddSubtask(e)
                                            }
                                        }}
                                        className="h-8 flex-1 bg-transparent border-0 focus-visible:ring-0 px-0 placeholder:text-muted-foreground/70"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <FormField
                            control={form.control}
                            name="tagIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags</FormLabel>
                                    <FormControl>
                                        <div className="block">
                                            <TagManager
                                                selectedTagIds={field.value || []}
                                                onToggleTag={(tagId) => {
                                                    const current = field.value || []
                                                    if (current.includes(tagId)) {
                                                        field.onChange(current.filter((id: string) => id !== tagId))
                                                    } else {
                                                        field.onChange([...current, tagId])
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="scheduledTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="time"
                                                {...field}
                                                placeholder="HH:MM"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="durationMinutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration (Minutes)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="5"
                                            step="5"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
