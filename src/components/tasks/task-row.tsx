'use client'

import { format, isToday, isTomorrow } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MoreHorizontal, Trash, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// import { EditTaskDialog } from './edit-task-dialog'

import { DeleteTaskDialog } from './delete-task-dialog'

interface TaskRowProps {
    task: any
}

export function TaskRow({ task }: TaskRowProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    // const [showEditDialog, setShowEditDialog] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

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

        // TODO: Open task detail panel when merged from other branch
        console.log('Task clicked:', task.id)
    }

    const handleDelete = async () => {
        await deleteTask(task.id)
        router.refresh()
    }

    const getPriorityColor = (priority?: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200/50 dark:border-red-900/30'
            case 'high':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30'
            case 'medium':
                return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30'
            case 'low':
                return 'bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200/50 dark:border-slate-900/30'
            default:
                return 'bg-muted/50 text-muted-foreground/70 border-border/30'
        }
    }

    const getPriorityLabel = (priority?: string | null) => {
        if (!priority) return ''
        return priority.charAt(0).toUpperCase() + priority.slice(1)
    }

    const formatDueDate = (date?: Date | null) => {
        if (!date) return ''
        const d = new Date(date)
        if (isToday(d)) {
            return `Today ${format(d, 'h:mm a')}`
        }
        if (isTomorrow(d)) {
            return `Tomorrow ${format(d, 'h:mm a')}`
        }
        if (d.getHours() === 0 && d.getMinutes() === 0) {
            return format(d, 'MMM d')
        }
        return `${format(d, 'MMM d')} ${format(d, 'h:mm a')}`
    }

    const priority = task.priority?.toLowerCase() || 'none'
    const hasPriority = priority !== 'none'

    return (
        <>
            <div
                onClick={handleRowClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    // Soft Card System - Default State
                    "group relative flex items-center gap-4 px-4 py-3.5 rounded-[14px] cursor-pointer",
                    "transition-all duration-200 ease-out",
                    
                    // Default: Nearly flat, subtle background
                    "bg-card/40 dark:bg-card/20",
                    
                    // Hover: Slight elevation
                    !task.completed && isHovered && [
                        "bg-card/80 dark:bg-card/40",
                        "shadow-sm shadow-black/5 dark:shadow-black/20",
                        "scale-[1.005]"
                    ],
                    
                    // Completed: Lower opacity, reduced contrast
                    task.completed && [
                        "opacity-50",
                        "bg-muted/20 dark:bg-muted/10"
                    ]
                )}
            >
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={task.completed}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                        className="h-5 w-5 rounded-md border-2 transition-all data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <p className={cn(
                            "font-medium text-[15px] leading-snug truncate transition-colors",
                            task.completed ? "line-through text-muted-foreground/70" : "text-foreground"
                        )}>
                            {task.title}
                        </p>
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground/60 shrink-0" title={`${task.subtasks.filter((st: any) => st.completed).length}/${task.subtasks.length} subtasks`}>
                                <GitBranch className="h-3 w-3" />
                                <span className="text-[11px] font-medium tabular-nums">
                                    {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length}
                                </span>
                            </div>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-[13px] text-muted-foreground/70 mt-1 truncate leading-relaxed">
                            {task.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {task.dueDate && (
                        <div className="text-[13px] text-muted-foreground/70 font-medium whitespace-nowrap">
                            {formatDueDate(task.dueDate)}
                        </div>
                    )}
                    {hasPriority && (
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                            getPriorityColor(task.priority)
                        )}>
                            {getPriorityLabel(task.priority)}
                        </div>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                    "h-7 w-7 transition-opacity",
                                    isHovered ? "opacity-100" : "opacity-0"
                                )}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* <DropdownMenuItem
                                onClick={(e) => e.stopPropagation()}
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowEditDialog(true)
                                }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem> */}
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

            {/* <EditTaskDialog
                task={task}
                isOpen={showEditDialog}
                onOpenChange={setShowEditDialog}
            /> */}
        </>
    )
}
