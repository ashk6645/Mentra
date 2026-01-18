'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, CalendarIcon, Sparkles, Wand2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { TagManager } from '@/components/tags/tag-manager'
import { RecurrenceSelector } from './recurrence-selector'

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
import { createTask } from '@/lib/actions/tasks'
import { getProjects } from '@/lib/actions/projects'
import { parseTaskInput, getTaskSuggestions } from '@/lib/actions/ai'
import { getTags } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import { Priority, Project, Tag } from '@prisma/client'

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.nativeEnum(Priority),
    dueDate: z.date().optional(),
    projectId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    recurrenceRule: z.string().optional(),
})

export function CreateTaskDialog({ projectId }: { projectId?: string }) {
    const [open, setOpen] = useState(false)
    const [projects, setProjects] = useState<Project[]>([])
    const [tags, setTags] = useState<Tag[]>([])

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
            priority: Priority.NONE,
            projectId: projectId || '',
            tagIds: [],
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

                // Clear AI input after successful parsing
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
                // Merge unique tags
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
        const result = await createTask({
            ...values,
            dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
            projectId: values.projectId === 'none' ? undefined : values.projectId, // Handle "No Project"
            isRecurring: !!values.recurrenceRule,
            recurrenceRule: values.recurrenceRule
        })
        console.log('Submitting task:', values)
        try {
            const result = await createTask({
                ...values,
                dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
                projectId: values.projectId === 'none' ? undefined : values.projectId, // Handle "No Project"
                isRecurring: !!values.recurrenceRule,
                recurrenceRule: values.recurrenceRule
            })
            console.log('Task creation result:', result)

            if (result.success) {
                setOpen(false)
                form.reset()
                router.refresh()
            } else {
                console.error('Task creation failed:', result.error)
            }
        } catch (e) {
            console.error('Task creation exception:', e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-purple-500" />
                        <Input
                            placeholder="Magic Add: 'Buy milk tomorrow at 5pm priority high'"
                            className="pl-9 border-purple-200 focus-visible:ring-purple-500"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAIParse()
                                }
                            }}
                            disabled={isAIThinking}
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAIParse}
                        disabled={isAIThinking || !aiInput.trim()}
                    >
                        {isAIThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Auto-Fill'}
                    </Button>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex gap-2 items-start">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="What needs to be done?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="mt-8 text-purple-500 border-purple-200 hover:bg-purple-50"
                                onClick={handleMagicSuggest}
                                disabled={isSuggesting || !form.watch('title')}
                                title="Magic Suggest (Predict details)"
                            >
                                {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                            </Button>
                        </div>

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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={Priority.NONE}>None</SelectItem>
                                                <SelectItem value={Priority.LOW}>Low</SelectItem>
                                                <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                                                <SelectItem value={Priority.HIGH}>High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || (projectId ? projectId : 'none')}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select project" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No Project</SelectItem>
                                                {projects.map(project => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.name}
                                                    </SelectItem>
                                                ))}
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

                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col flex-1">
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
                                                    selected={field.value}
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
                                name="recurrenceRule"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Repeat</FormLabel>
                                        <FormControl>
                                            <RecurrenceSelector
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
