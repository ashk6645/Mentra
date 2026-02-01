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
                    "group relative flex items-start gap-4 py-3.5 px-4 cursor-default transition-all duration-200",

                    // Row Separation: Extremely subtle divider
                    "border-b border-border/20 dark:border-border/10 last:border-0",

                    // Default State: Clean
                    "bg-transparent",

                    // Hover State: Subtle tint, not heavy
                    !task.completed && "hover:bg-muted/30 dark:hover:bg-muted/10",

                    // Completed State: More muted, lower contrast
                    task.completed && "opacity-40 hover:opacity-80 bg-muted/5"
                )}
            >
                {/* Drag Handle - Implicitly handled by Sortable parent, but we keep space clean */}

                {/* Checkbox - Left aligned */}
                <div onClick={(e) => e.stopPropagation()} className="pt-0.5 shrink-0">
                    <Checkbox
                        checked={task.completed}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                        className={cn(
                            "h-5 w-5 rounded-full transition-all duration-300",
                            "border-muted-foreground/30 dark:border-muted-foreground/40",
                            "data-[state=checked]:bg-primary/80 data-[state=checked]:border-primary/80",
                            "hover:border-primary/60 dark:hover:border-primary/60"
                        )}
                    />
                </div>

                {/* Center Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-[15px] font-medium leading-snug transition-colors duration-200",
                            task.completed
                                ? "line-through text-muted-foreground/70"
                                : "text-foreground/90 group-hover:text-foreground"
                        )}>
                            {task.title}
                        </span>

                        {/* Subtasks Indicator - Inline */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground/40 shrink-0 select-none"
                                title={`${task.subtasks.filter((st: any) => st.completed).length}/${task.subtasks.length} subtasks`}>
                                <GitBranch className="h-3 w-3" />
                                <span className="text-[11px] font-medium tabular-nums">
                                    {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description - Secondary */}
                    {task.description && (
                        <p className={cn(
                            "text-[13px] truncate leading-relaxed transition-colors",
                            task.completed ? "text-muted-foreground/50" : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
                        )}>
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Right Metadata - Visual Hierarchy: Priority > Date > Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start pt-0.5 min-h-[24px]">

                    {/* Priority Badge - Most visible metadata */}
                    {task.priority && task.priority !== 'none' && !task.completed && (
                        <div className={cn(
                            "px-2 py-[2px] rounded text-[10px] font-semibold tracking-wide uppercase select-none",
                            getPriorityColor(task.priority)
                        )}>
                            {task.priority}
                        </div>
                    )}

                    {/* Due Date - Subtle, secondary */}
                    {task.dueDate && !task.completed && (
                        <div className={cn(
                            "text-[12px] tabular-nums font-medium transition-colors select-none",
                            // Red if overdue, otherwise very muted
                            task.dueDate < new Date()
                                ? "text-red-500/80 dark:text-red-400"
                                : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                        )}>
                            {formatDueDate(task.dueDate)}
                        </div>
                    )}

                    {/* Actions Menu - Only visible on hover */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-6 w-6 transition-all duration-200",
                                    "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50",
                                    isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
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
