'use client'

import { useAnimate } from 'framer-motion'
import confetti from 'canvas-confetti'

import { format, isToday, isTomorrow } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { formatRecurrence } from '@/lib/utils/recurrence'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { MoreHorizontal, Trash, Clock, CheckSquare, Repeat, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteTaskDialog } from './delete-task-dialog'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useTaskSelectionStore } from '@/stores/use-task-selection-store'
import { useToggleTask, useDeleteTask } from '@/lib/hooks/use-tasks'



interface TaskRowProps {
    task: any // Using any to avoid type conflicts with shared components for now
}

export function TaskRow({ task }: TaskRowProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const { selectedTaskId } = useTaskDetailStore()
    const isDetailed = selectedTaskId === task.id

    const { selectedIds, toggleSelection, isSelectionMode } = useTaskSelectionStore()
    const isMultiSelected = selectedIds.has(task.id)

    const [scope, animate] = useAnimate()

    const { mutateAsync: toggleTask } = useToggleTask()
    const { mutateAsync: deleteTask } = useDeleteTask()

    const handleToggle = async (checked: boolean) => {
        setIsPending(true)
        // 1. Optimistic UI update - we expect the checkbox to update immediately via its own state, 
        // but we trigger the side effects here.

        try {
            // 2. Confetti (only on completion) - Subtle and premium
            if (checked) {
                const rect = scope.current.getBoundingClientRect()
                const x = (rect.left + rect.width / 2) / window.innerWidth
                const y = (rect.top + rect.height / 2) / window.innerHeight

                confetti({
                    particleCount: 25,
                    spread: 50,
                    origin: { x, y },
                    colors: ['#10b981', '#22c55e', '#86efac'], // Brand-consistent greens
                    disableForReducedMotion: true,
                    zIndex: 1000,
                    startVelocity: 20,
                    decay: 0.92,
                    gravity: 0.8,
                    ticks: 150,
                    scalar: 0.8,
                })
            }

            // 3. Server sync (start parallel with animation)
            const togglePromise = toggleTask({ id: task.id, completed: checked })

            // 4. Exit animation removed - user wants task to stay visible
            if (checked) {
                await animate(scope.current,
                    {
                        opacity: [1, 0.6, 0],
                        x: [0, 10, 20],
                        height: [scope.current.offsetHeight, 0],
                        marginBottom: [12, 0],
                        paddingBlock: [14, 0],
                        border: 0
                    },
                    {
                        duration: 0.4, // Slightly longer for smoother feel
                        ease: [0.32, 0.72, 0, 1] // Custom easing
                    }
                )
            }


            await togglePromise
            router.refresh()
        } catch (error) {
            console.error('Failed to toggle task', error)
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    const handleRowClick = (e: React.MouseEvent) => {
        // Prevent opening if clicking on checkbox or menu actions
        if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
        if ((e.target as HTMLElement).closest('[data-radix-collection-item]')) return
        if ((e.target as HTMLElement).closest('button')) return
        if (e.defaultPrevented) return

        // Open task detail panel with task data
        const { selectTask } = require('@/stores/use-task-detail-store').useTaskDetailStore.getState()
        selectTask(task.id, task)
    }

    const handleDelete = async () => {
        await deleteTask(task.id)
        router.refresh()
    }

    const getPriorityStyles = (priority?: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return {
                    bg: 'bg-red-50 dark:bg-red-950/30',
                    text: 'text-red-600 dark:text-red-400',
                    label: 'Urgent'
                }
            case 'high':
                return {
                    bg: 'bg-orange-50 dark:bg-orange-950/30',
                    text: 'text-orange-600 dark:text-orange-400',
                    label: 'High'
                }
            case 'medium':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-950/30',
                    text: 'text-blue-600 dark:text-blue-400',
                    label: 'Medium'
                }
            case 'low':
                return {
                    bg: 'bg-gray-50 dark:bg-gray-800',
                    text: 'text-gray-600 dark:text-gray-400',
                    label: 'Low'
                }
            default:
                return null
        }
    }

    const formatDueDate = (date?: Date | null) => {
        if (!date) return null
        const d = new Date(date)
        const now = new Date()
        const isOverdue = d < now && !task.completed
        const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0

        let text = ''
        if (isToday(d)) {
            text = hasTime ? format(d, 'h:mm a') : 'Today'
        } else if (isTomorrow(d)) {
            text = hasTime ? `Tomorrow ${format(d, 'h:mm a')}` : 'Tomorrow'
        } else {
            text = hasTime ? `${format(d, 'MMM d')} ${format(d, 'h:mm a')}` : format(d, 'MMM d')
        }

        return { text, isOverdue }
    }

    const priorityStyles = getPriorityStyles(task.priority)
    const dueDateInfo = formatDueDate(task.dueDate)
    const isOverdue = dueDateInfo?.isOverdue
    const hasSubtasks = task.subtasks && task.subtasks.length > 0
    const completedSubtasks = hasSubtasks ? task.subtasks.filter((st: any) => st.completed).length : 0
    const totalSubtasks = hasSubtasks ? task.subtasks.length : 0

    return (
        <>
            <div
                ref={scope}
                onClick={handleRowClick}
                data-task-id={task.id}
                tabIndex={0}
                className={cn(
                    "group relative flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer",
                    "bg-card border transition-all duration-200",

                    // Base border (overridden by specific states below)
                    "border-border/30",

                    // Hover state
                    "hover:shadow-sm hover:-translate-y-0.5",

                    // Focus state
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",

                    // Completed state
                    task.completed && "opacity-60",

                    // Priority & Status Indicators (Left Border)
                    // Priority uses border-l-4 to curve perfectly with the container's radius
                    !task.completed && (
                        // Overdue State (Red)
                        isOverdue ? "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10" :
                            // Detailed/Selected State (Blue)
                            isDetailed ? "border-l-4 border-l-blue-500" :
                                // Priority States
                                task.priority === 'urgent' ? "border-l-4 border-l-red-500" :
                                    task.priority === 'high' ? "border-l-4 border-l-orange-500" :
                                        task.priority === 'medium' ? "border-l-4 border-l-blue-500" :
                                            task.priority === 'low' ? "border-l-4 border-l-gray-400" :
                                                // Default Hover for non-priority tasks (optional, keeping clean for now)
                                                "hover:border-border"
                    )
                )}>

                {/* Checkbox Area - Swaps between Completion and Selection based on mode */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center justify-center">
                    {isSelectionMode ? (
                        <div className="shrink-0 transition-all duration-200 animate-in fade-in zoom-in-50">
                            <Checkbox
                                checked={isMultiSelected}
                                onCheckedChange={() => toggleSelection(task.id)}
                                className="h-5 w-5 border-2 border-muted-foreground/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                        </div>
                    ) : (
                        <Checkbox
                            checked={task.completed}
                            onCheckedChange={handleToggle}
                            disabled={isPending}
                            className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-accent/20 data-[state=checked]:bg-success data-[state=checked]:border-success transition-all duration-200"
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    {/* Title and subtask progress */}
                    <div className="flex items-center gap-2">
                        <h3 className={cn(
                            "font-semibold text-[15px] leading-tight text-foreground",
                            task.completed && "line-through text-muted-foreground"
                        )}>
                            {task.title}
                        </h3>
                        {hasSubtasks && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <CheckSquare className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                    {completedSubtasks}/{totalSubtasks}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-1">
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Right side metadata - Fade in on hover */}
                <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Recurring badge */}
                    {task.isRecurring && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30">
                            <Repeat className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">
                                {formatRecurrence(task.recurrenceInterval, task.recurrenceStep, task.recurrenceDays)}
                            </span>
                        </div>
                    )}

                    {/* Due date */}
                    {dueDateInfo && (
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium",
                            dueDateInfo?.isOverdue ? "text-red-500" : "text-muted-foreground"
                        )}>
                            <Clock className="h-3.5 w-3.5" />
                            <span>{dueDateInfo?.text}</span>
                        </div>
                    )}

                    {/* Reminder indicator */}
                    {task.reminders && task.reminders.some((r: any) => !r.isSent) && (
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <Bell className="h-3.5 w-3.5 fill-current" />
                        </div>
                    )}

                    {/* Priority badge */}
                    {priorityStyles && (
                        <div className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium",
                            priorityStyles.bg,
                            priorityStyles.text
                        )}>
                            {priorityStyles.label}
                        </div>
                    )}

                    {/* More menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Task actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowDeleteDialog(true)
                                }}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DeleteTaskDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                taskTitle={task.title}
            />
        </>
    )
}
