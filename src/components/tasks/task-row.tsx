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
import { DeleteTaskDialog } from './delete-task-dialog'

interface TaskRowProps {
    task: any
}

export function TaskRow({ task }: TaskRowProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
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

        console.log('Task clicked:', task.id)
    }

    const handleDelete = async () => {
        await deleteTask(task.id)
        router.refresh()
    }

    const getPriorityColor = (priority?: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400'
            case 'high':
                return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
            case 'medium':
                return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400'
            case 'low':
                return 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
            default:
                return 'text-muted-foreground'
        }
    }

    const formatDueDate = (date?: Date | null) => {
        if (!date) return ''
        const d = new Date(date)
        if (isToday(d)) {
            return `Today`
        }
        if (isTomorrow(d)) {
            return `Tomorrow`
        }
        return format(d, 'MMM d')
    }

    return (
        <>
            <div
                onClick={handleRowClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    // Base Layout
                    "group relative flex items-start gap-3 py-3 px-4 rounded-lg cursor-default",
                    "border-b border-transparent transition-all duration-200",

                    // Hover State
                    "hover:bg-muted/40",

                    // Completed State
                    task.completed && "opacity-50"
                )}
            >
                {/* Drag Handle (Visible on Hover from parent sortable usually, but we can add visual cue here if needed) */}
                {/* This matches the updated plan to keep it calm and minimal. 
                     The Sortable component handles the actual drag listeners, 
                     but we can show a visual hint if desired. 
                     For now, we let the Sortable wrapper handle the grip. */}

                {/* Checkbox */}
                <div onClick={(e) => e.stopPropagation()} className="pt-0.5 shrink-0">
                    <Checkbox
                        checked={task.completed}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                        className={cn(
                            "h-5 w-5 rounded-full transition-all border-muted-foreground/40",
                            "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                            "hover:border-primary/60"
                        )}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-[15px] font-medium leading-snug transition-colors",
                            task.completed ? "line-through text-muted-foreground" : "text-foreground"
                        )}>
                            {task.title}
                        </span>

                        {/* Subtasks Indicator */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground/60 shrink-0"
                                title={`${task.subtasks.filter((st: any) => st.completed).length}/${task.subtasks.length} subtasks`}>
                                <GitBranch className="h-3 w-3" />
                                <span className="text-[11px] font-medium tabular-nums">
                                    {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className={cn(
                            "text-[13px] mt-0.5 truncate leading-relaxed",
                            task.completed ? "text-muted-foreground/60" : "text-muted-foreground/80"
                        )}>
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Right Metadata */}
                <div className="flex items-center gap-4 shrink-0 self-start pt-0.5">

                    {/* Priority Badge */}
                    {task.priority && task.priority !== 'none' && (
                        <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                            getPriorityColor(task.priority)
                        )}>
                            {task.priority}
                        </div>
                    )}

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className={cn(
                            "text-[12px] tabular-nums font-medium",
                            task.dueDate < new Date() && !task.completed ? "text-red-500" : "text-muted-foreground/70"
                        )}>
                            {formatDueDate(task.dueDate)}
                        </div>
                    )}

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-6 w-6 text-muted-foreground/50 hover:text-foreground hover:bg-transparent",
                                    isHovered ? "opacity-100" : "opacity-0"
                                )}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
