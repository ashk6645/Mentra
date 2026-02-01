'use client'

import { format, isToday, isTomorrow } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MoreHorizontal, Trash, GitBranch, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteTaskDialog } from './delete-task-dialog'
import { motion } from 'framer-motion'

interface TaskRowProps {
    task: any // Using any to avoid type conflicts with shared components for now
}

export function TaskRow({ task }: TaskRowProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setIsPending(true)
        try {
            await toggleTaskCompletion(task.id, checked)
            router.refresh()
        } catch (error) {
            console.error('Failed to toggle task', error)
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
                    bg: 'bg-gradient-to-br from-red-500 to-red-600',
                    text: 'text-white',
                    shadow: 'shadow-[0_2px_8px_rgba(239,68,68,0.25)]'
                }
            case 'high':
                return {
                    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
                    text: 'text-white',
                    shadow: 'shadow-[0_2px_8px_rgba(249,115,22,0.25)]'
                }
            case 'medium':
                return {
                    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
                    text: 'text-white',
                    shadow: 'shadow-[0_2px_8px_rgba(59,130,246,0.25)]'
                }
            case 'low':
                return {
                    bg: 'bg-muted',
                    text: 'text-muted-foreground',
                    shadow: ''
                }
            default:
                return {
                    bg: 'bg-muted',
                    text: 'text-muted-foreground',
                    shadow: ''
                }
        }
    }

    const getPriorityLabel = (priority?: string | null) => {
        if (!priority) return ''
        return priority.charAt(0).toUpperCase() + priority.slice(1)
    }

    const formatDueDate = (date?: Date | null) => {
        if (!date) return { text: '', isOverdue: false, isToday: false }
        const d = new Date(date)
        const now = new Date()
        const isOverdue = d < now && !task.completed
        const isTodayDate = isToday(d)
        
        let text = ''
        if (isTodayDate) {
            text = d.getHours() === 0 && d.getMinutes() === 0 
                ? 'Today' 
                : `Today ${format(d, 'h:mm a')}`
        } else if (isTomorrow(d)) {
            text = d.getHours() === 0 && d.getMinutes() === 0 
                ? 'Tomorrow' 
                : `Tomorrow ${format(d, 'h:mm a')}`
        } else if (d.getHours() === 0 && d.getMinutes() === 0) {
            text = format(d, 'MMM d')
        } else {
            text = `${format(d, 'MMM d')} ${format(d, 'h:mm a')}`
        }
        
        return { text, isOverdue, isToday: isTodayDate }
    }

    const priority = task.priority?.toLowerCase() || 'none'
    const hasPriority = priority !== 'none'
    const priorityStyles = getPriorityStyles(task.priority)
    const dueDateInfo = formatDueDate(task.dueDate)

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                onClick={handleRowClick}
                className={cn(
                    "group relative flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl cursor-pointer",
                    "transition-all duration-200 ease-out",
                    "hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]",
                    "hover:border-border/80 hover:-translate-y-0.5 hover:scale-[1.002]",
                    "active:scale-[0.998] active:transition-transform active:duration-100",
                    task.completed && "opacity-50 bg-muted/30"
                )}>
                
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-card to-card/98 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                
                <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                    <Checkbox
                        checked={task.completed}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                        className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-200"
                    />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className={cn(
                            "font-medium text-base leading-tight transition-all duration-200",
                            task.completed && "line-through opacity-60"
                        )}>
                            {task.title}
                        </h3>
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div 
                                className="flex items-center gap-1.5 text-tertiary shrink-0 px-2 py-0.5 rounded-md bg-muted/50" 
                                title={`${task.subtasks.filter((st: any) => st.completed).length}/${task.subtasks.length} subtasks completed`}
                            >
                                <GitBranch className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                    {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length}
                                </span>
                            </div>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-1 mt-1.5">
                            {task.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 shrink-0 relative z-10">
                    {task.dueDate && (
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2.5 py-1 rounded-md transition-colors",
                            dueDateInfo.isOverdue && "text-destructive bg-destructive/10",
                            dueDateInfo.isToday && !dueDateInfo.isOverdue && "text-warning bg-warning/10",
                            !dueDateInfo.isOverdue && !dueDateInfo.isToday && "text-muted-foreground bg-muted/50"
                        )}>
                            {dueDateInfo.isOverdue ? (
                                <AlertCircle className="h-3.5 w-3.5" />
                            ) : (
                                <Calendar className="h-3.5 w-3.5" />
                            )}
                            <span>{dueDateInfo.text}</span>
                        </div>
                    )}
                    {hasPriority && (
                        <div className={cn(
                            "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200",
                            priorityStyles.bg,
                            priorityStyles.text,
                            priorityStyles.shadow
                        )}>
                            {getPriorityLabel(task.priority)}
                        </div>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Task actions menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowDeleteDialog(true)
                                }}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.div>

            <DeleteTaskDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                taskTitle={task.title}
            />
        </>
    )
}
