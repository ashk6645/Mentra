'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CalendarIcon, Pencil, Clock, Flag, Tag as TagIcon } from 'lucide-react'
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
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

const priorityConfig = {
    low: { label: 'Low', color: 'text-blue-600 dark:text-blue-400' },
    medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' },
    high: { label: 'High', color: 'text-orange-600 dark:text-orange-400' },
    urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400' },
}

export function EditTaskDialog({ task, trigger, isOpen, onOpenChange }: EditTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    // Use controlled state if provided, otherwise internal state
    const isControlled = isOpen !== undefined
    const open = isControlled ? isOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const [tags, setTags] = useState<Tag[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

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
            if (task.subtasks) {
                setLocalSubtasks(task.subtasks)
            }
        }
    }, [open, task.subtasks])

    const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>(task.subtasks || [])
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [isAddingSubtask, setIsAddingSubtask] = useState(false)

    async function handleAddSubtask(e: React.FormEvent) {
        e.preventDefault()
        if (!newSubtaskTitle.trim()) return

        const tempId = `temp-${Date.now()}`
        const optimisticSubtask: any = {
            id: tempId,
            taskId: task.id,
            title: newSubtaskTitle,
            completed: false,
            createdAt: new Date(),
            sortOrder: localSubtasks.length
        }

        setLocalSubtasks([...localSubtasks, optimisticSubtask])
        setNewSubtaskTitle('')
        setIsAddingSubtask(false)

        const res = await createSubtask(task.id, optimisticSubtask.title)
        if (res.success && res.data) {
            setLocalSubtasks(prev => prev.map(st => st.id === tempId ? res.data : st))
        } else {
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
            let scheduledStart: string | undefined
            let scheduledEnd: string | undefined

            if (values.dueDate && values.scheduledTime) {
                const [hours, minutes] = values.scheduledTime.split(':').map(Number)
                const startDate = new Date(values.dueDate)
                startDate.setHours(hours, minutes, 0, 0)
                scheduledStart = startDate.toISOString()
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
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
                {/* Header with subtle border */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-semibold">Edit Task</DialogTitle>
                </DialogHeader>

                {/* Scrollable content area */}
                <div className="overflow-y-auto custom-scrollbar px-6 py-5 flex-1 min-h-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Title - Large and prominent */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-muted-foreground">Task Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="What needs to be done?"
                                                className="text-base h-11 bg-muted/40 border-muted-foreground/20 focus-visible:bg-background transition-colors"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-muted-foreground">Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add more details..."
                                                className="resize-none min-h-[100px] bg-muted/40 border-muted-foreground/20 focus-visible:bg-background transition-colors"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Subtasks - Card style with better visual separation */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-medium text-muted-foreground">Subtasks</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300 rounded-full"
                                                style={{
                                                    width: `${localSubtasks.length > 0 ? (localSubtasks.filter(st => st.completed).length / localSubtasks.length) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                            {localSubtasks.filter(st => st.completed).length}/{localSubtasks.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="border rounded-lg bg-muted/30 divide-y">
                                    {localSubtasks.length > 0 && (
                                        <div className="divide-y">
                                            {localSubtasks.map((subtask) => (
                                                <div key={subtask.id} className="flex items-center gap-3 px-3 py-2.5 group hover:bg-muted/50 transition-colors">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "h-4 w-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0",
                                                            subtask.completed
                                                                ? "bg-primary border-primary scale-100"
                                                                : "border-muted-foreground/40 hover:border-primary hover:scale-110"
                                                        )}
                                                        onClick={() => handleToggleSubtask(subtask.id, !subtask.completed)}
                                                    >
                                                        {subtask.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
                                                    </button>
                                                    <span className={cn(
                                                        "text-sm flex-1 transition-all",
                                                        subtask.completed && "line-through text-muted-foreground/70"
                                                    )}>
                                                        {subtask.title}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteSubtask(subtask.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 px-3 py-2.5">
                                        <div className="h-4 w-4 flex items-center justify-center shrink-0">
                                            <Plus className="h-3.5 w-3.5 text-muted-foreground/60" />
                                        </div>
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
                                            className="h-7 flex-1 bg-transparent border-0 focus-visible:ring-0 px-0 text-sm placeholder:text-muted-foreground/60 shadow-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Priority and Tags - Side by side with icons */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                                <Flag className="h-3.5 w-3.5" />
                                                Priority
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/40 border-muted-foreground/20 h-10">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                            Low
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                            Medium
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="high">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                            High
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="urgent">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                                            Urgent
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="durationMinutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                Duration
                                            </FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="5"
                                                        step="5"
                                                        className="bg-muted/40 border-muted-foreground/20 h-10 pr-12"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                                    />
                                                </FormControl>
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                                    mins
                                                </span>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Tags */}
                            <FormField
                                control={form.control}
                                name="tagIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                            <TagIcon className="h-3.5 w-3.5" />
                                            Tags
                                        </FormLabel>
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

                            {/* Date and Time - Better visual hierarchy */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-sm font-medium text-muted-foreground mb-2">Due Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-10 pl-3 text-left font-normal bg-muted/40 border-muted-foreground/20 hover:bg-muted/60",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "MMM dd, yyyy")
                                                            ) : (
                                                                <span>Pick date</span>
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
                                                        disabled={(date) => date < new Date("1900-01-01")}
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
                                            <FormLabel className="text-sm font-medium text-muted-foreground">Time</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    className="bg-muted/40 border-muted-foreground/20 h-10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Footer with actions - Sticky at bottom */}
                <div className="px-6 py-4 border-t bg-muted/20">
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            onClick={form.handleSubmit(onSubmit)}
                            className="h-10 px-6"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
