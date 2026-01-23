'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, CalendarIcon, Sparkles, Wand2, Clock, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TagManager } from '@/components/tags/tag-manager'
import { RecurrenceSelector } from './recurrence-selector'
import { QuickAddInput } from './quick-add-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
import { createTask, createTaskFromNaturalLanguage } from '@/lib/actions/tasks'
import { getProjects } from '@/lib/actions/projects'
import { parseTaskInput, getTaskSuggestions } from '@/lib/actions/ai'
import { getTags } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import { Project, Tag } from '@prisma/client'
import { ParsedTaskData } from '@/lib/parsers/task-parser'

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
    dueDate: z.date().optional(),
    scheduledTime: z.string().optional(),
    durationMinutes: z.number().optional(),
    projectId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
})

interface CreateTaskDialogProps {
    projectId?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultStatus?: string
    onTaskCreated?: (task: any) => void
    trigger?: React.ReactNode
}

export function CreateTaskDialog({
    projectId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    defaultStatus,
    onTaskCreated,
    trigger
}: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    // Helper to handle state change whether controlled or not
    const setOpen = (newOpen: boolean) => {
        if (controlledOnOpenChange) {
            controlledOnOpenChange(newOpen)
        } else {
            setInternalOpen(newOpen)
        }
    }

    const [projects, setProjects] = useState<Project[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick')

    // AI State
    const [aiInput, setAiInput] = useState('')
    const [isAIThinking, setIsAIThinking] = useState(false)
    const [isSuggesting, setIsSuggesting] = useState(false)

    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: null,
            projectId: projectId || '',
            tagIds: [],
            scheduledTime: '',
            durationMinutes: 30,
        },
    })

    // Fetch projects and tags
    useEffect(() => {
        if (open) {
            getProjects().then(setProjects)
            getTags().then(setTags)
        }
    }, [open])

    // Update default projectId if prop changes
    useEffect(() => {
        if (projectId) {
            form.setValue('projectId', projectId)
        }
    }, [projectId, form])

    const isLoading = form.formState.isSubmitting

    async function handleAIParse() {
        if (!aiInput.trim()) return

        setIsAIThinking(true)
        try {
            const result = await parseTaskInput(aiInput)
            if (result) {
                form.setValue('title', result.title)
                if (result.description) form.setValue('description', result.description)
                if (result.priority) form.setValue('priority', result.priority)
                if (result.dueDate) form.setValue('dueDate', new Date(result.dueDate))
                setAiInput('')
            }
        } catch (error) {
            console.error("AI Parse failed", error)
        } finally {
            setIsAIThinking(false)
        }
    }

    async function handleMagicSuggest() {
        const title = form.getValues('title')
        const description = form.getValues('description')

        if (!title.trim()) return

        setIsSuggesting(true)
        try {
            const suggestions = await getTaskSuggestions(
                title,
                description,
                projects.map(p => ({ id: p.id, name: p.name })),
                tags.map(t => ({ id: t.id, name: t.name }))
            )

            if (suggestions.priority) form.setValue('priority', suggestions.priority)
            if (suggestions.projectId) form.setValue('projectId', suggestions.projectId)
            if (suggestions.tagIds && suggestions.tagIds.length > 0) {
                const currentTags = form.getValues('tagIds') || []
                const newTags = Array.from(new Set([...currentTags, ...suggestions.tagIds]))
                form.setValue('tagIds', newTags)
            }
        } catch (error) {
            console.error("Magic Suggest failed", error)
        } finally {
            setIsSuggesting(false)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
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

            const result = await createTask({
                ...values,
                dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
                projectId: values.projectId === 'none' ? undefined : values.projectId,
                scheduledStart,
                scheduledEnd,
            })

            if (result.success) {
                setOpen(false)
                form.reset()
                router.refresh()
            }
        } catch (e) {
            console.error('Task creation exception:', e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] gap-6">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create Task</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'detailed')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="quick" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Quick Add
                        </TabsTrigger>
                        <TabsTrigger value="detailed" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Detailed Form
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="quick" className="mt-4">
                        <QuickAddInput
                            onSubmit={async (parsedData: ParsedTaskData) => {
                                const result = await createTaskFromNaturalLanguage(parsedData.rawInput)
                                if (result.success) {
                                    setOpen(false)
                                    router.refresh()
                                    if (onTaskCreated && result.data) {
                                        onTaskCreated(result.data)
                                    }
                                }
                            }}
                            onCancel={() => setOpen(false)}
                            availableProjects={projects}
                            availableTags={tags}
                        />
                    </TabsContent>

                    <TabsContent value="detailed" className="mt-4">

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Task title"
                                                        className="text-lg font-medium border-none px-0 shadow-none rounded-none border-b focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                                                        {...field}
                                                    />
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
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Add description..."
                                                        className="resize-none min-h-[80px] border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="projectId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Project</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || (projectId ? projectId : 'none')}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Inbox" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">Inbox</SelectItem>
                                                        {projects.map(project => (
                                                            <SelectItem key={project.id} value={project.id}>
                                                                {project.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Priority</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="None" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="urgent">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dueDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Due Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal h-9",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PP")
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
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date("1900-01-01")}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="scheduledTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Time</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type="time"
                                                            className="h-9"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="tagIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Tags</FormLabel>
                                            <FormControl>
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
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-between items-center pt-4 border-t">
                                    {/* Magic Suggest Button */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-2"
                                        onClick={handleMagicSuggest}
                                        disabled={isSuggesting || !form.watch('title')}
                                        title="Use AI to suggest details"
                                    >
                                        {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                        AI Suggest Tips
                                    </Button>

                                    <div className="flex gap-2">
                                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Task
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
