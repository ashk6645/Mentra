'use client'

import { useState } from 'react'
import { Task, Priority } from '@prisma/client'
import { format } from 'date-fns'
import { Calendar, Flag, MoreHorizontal, Trash, Check, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { generateSubtasks } from '@/lib/actions/ai'
import { createSubTask } from '@/lib/actions/subtasks'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface TaskCardProps {
    task: Task
}

// Priority colors following design system (semantic meaning)
const priorityColors = {
    [Priority.HIGH]: 'text-destructive',      // Red = danger/urgency
    [Priority.MEDIUM]: 'text-warning',        // Amber = attention needed
    [Priority.LOW]: 'text-primary',           // Blue = calm, normal
    [Priority.NONE]: 'text-muted-foreground', // Gray = de-emphasized
}

export function TaskCard({ task }: { task: Task & { subTasks?: Task[], tags?: { tag: { id: string, name: string, color: string | null } }[] } }) {
    const router = useRouter()
    const [isThinking, setIsThinking] = useState(false)
    const [showSubtasks, setShowSubtasks] = useState(false)
    const [isAddingSubtask, setIsAddingSubtask] = useState(false)
    const [subtaskTitle, setSubtaskTitle] = useState('')
    const [isAIGenerating, setIsAIGenerating] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setIsThinking(true)
        await toggleTaskCompletion(task.id, checked)
        setIsThinking(false)
        router.refresh()
    }

    const handleDelete = async () => {
        setIsThinking(true)
        await deleteTask(task.id)
        router.refresh()
    }

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subtaskTitle.trim()) return

        setIsThinking(true)
        // Dynamically import to avoid circular dependency issues if any, or just use valid path
        const { createSubTask } = await import('@/lib/actions/subtasks')

        await createSubTask({
            parentTaskId: task.id,
            title: subtaskTitle,
            priority: Priority.NONE
        })

        setSubtaskTitle('')
        setIsAddingSubtask(false)
        setIsThinking(false)
        setShowSubtasks(true) // Ensure list is open
        router.refresh()
    }

    const handleAIBreakdown = async () => {
        setIsAIGenerating(true)
        setShowSubtasks(true) // Expand to show loading

        try {
            const steps = await generateSubtasks(task.title, task.description || undefined)

            if (steps.length > 0) {
                // Create subtasks sequentially to maintain order
                for (const step of steps) {
                    await createSubTask({
                        parentTaskId: task.id,
                        title: step.title,
                        priority: Priority.NONE
                    })
                }
                router.refresh()
            }
        } catch (error) {
            console.error("Failed to generate subtasks", error)
        } finally {
            setIsAIGenerating(false)
        }
    }


    const completedSubtasks = task.subTasks?.filter(t => t.isCompleted).length || 0
    const totalSubtasks = task.subTasks?.length || 0
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
        >
            <div className={cn(
                // Design system: 16px padding, subtle hover (border strengthen), 200ms transition
                "group flex items-start space-x-3 rounded-lg border p-4 transition-quick hover:shadow-md hover:border-border-strong bg-card",
                // Completion: 50% opacity following design system pattern
                task.isCompleted && "opacity-50 bg-muted/30"
            )}>
                <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={handleToggle}
                    className="mt-1"
                    disabled={isThinking}
                />

                <div className="flex-1 space-y-2">
                    {/* Typography: Body Large (16px, 500 weight) for task titles */}
                    <div className={cn(
                        "font-medium text-base leading-tight transition-quick cursor-pointer",
                        // Completion animation: strikethrough + fade (200ms)
                        task.isCompleted && "line-through opacity-50"
                    )} onClick={() => setShowSubtasks(!showSubtasks)}>
                        {task.title}
                    </div>

                    {task.description && (
                        <p className="text-sm text-secondary leading-relaxed line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Metadata: Small text (12px), tertiary color */}
                    <div className="flex items-center gap-4 pt-1 text-xs text-tertiary">
                        {task.dueDate && (
                            <div className={cn(
                                "flex items-center gap-1",
                                // Overdue gets destructive color (reserved for urgency)
                                task.dueDate < new Date() && !task.isCompleted && "text-destructive font-medium"
                            )}>
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                        )}

                        <div className={cn("flex items-center", priorityColors[task.priority])}>
                            <Flag className="mr-1 h-3 w-3" />
                            {task.priority !== Priority.NONE && task.priority}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 ml-2">
                                {task.tags.map(({ tag }) => (
                                    <Badge key={tag.id} variant="secondary" className="h-5 px-1.5 text-[10px]">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {totalSubtasks > 0 && (
                            <div className="flex items-center text-muted-foreground">
                                <span className="mr-1">{completedSubtasks}/{totalSubtasks}</span>
                                <div className="h-1 w-12 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsAddingSubtask(true)}>
                            Add Subtask
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAIBreakdown} disabled={isAIGenerating}>
                            {isAIGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                            )}
                            Break Down with AI
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Subtasks Area */}
            {(showSubtasks || isAddingSubtask || isAIGenerating) && (
                <div className="ml-8 border-l-2 pl-4 space-y-2">
                    {isAIGenerating && (
                        <div className="flex items-center gap-2 text-sm text-primary animate-pulse py-2">
                            <Sparkles className="h-3 w-3" />
                            <span>AI is thinking of steps...</span>
                        </div>
                    )}

                    {task.subTasks?.map(subtask => (
                        <TaskCard key={subtask.id} task={subtask} />
                    ))}

                    {isAddingSubtask && (
                        <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                            <input
                                autoFocus
                                type="text"
                                className="flex-1 h-10 text-sm bg-transparent border-b border-border focus:border-primary focus:outline-none transition-quick placeholder:text-tertiary"
                                placeholder="Type subtask and press Enter..."
                                value={subtaskTitle}
                                onChange={(e) => setSubtaskTitle(e.target.value)}
                                onBlur={() => !subtaskTitle && setIsAddingSubtask(false)}
                            />
                        </form>
                    )}
                </div>
            )}
        </motion.div>
    )
}
