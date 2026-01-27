'use client'

import { format, isToday, isTomorrow } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditTaskDialog } from './edit-task-dialog'

import { DeleteTaskDialog } from './delete-task-dialog'

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

    const handleDelete = async () => {
        await deleteTask(task.id)
        router.refresh()
    }

    const getPriorityColor = (priority?: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'bg-red-600 text-white'
            case 'high':
                return 'bg-orange-500 text-white'
            case 'medium':
                return 'bg-blue-500 text-white'
            case 'low':
                return 'bg-slate-500 text-white'
            default:
                return 'bg-gray-500 text-white'
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
        <div className={cn(
            "group flex items-center gap-4 p-4 bg-card border rounded-lg shadow-sm transition-all hover:shadow-md",
            task.completed && "opacity-60 bg-muted/20"
        )}>
            <Checkbox
                checked={task.completed}
                onCheckedChange={handleToggle}
                disabled={isPending}
                className="h-5 w-5 rounded-sm border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />

            <div className="flex-1 min-w-0">
                <p className={cn(
                    "font-semibold text-base leading-none truncate cursor-pointer hover:text-primary transition-colors",
                    task.completed && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </p>
                {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                        {task.description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {task.dueDate && (
                    <div className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                        {formatDueDate(task.dueDate)}
                    </div>
                )}
                {hasPriority && (
                    <div className={cn(
                        "px-2.5 py-0.5 rounded text-xs font-semibold",
                        getPriorityColor(task.priority)
                    )}>
                        {getPriorityLabel(task.priority)}
                    </div>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <EditTaskDialog
                            task={task}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            }
                        />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
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

                <DeleteTaskDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleDelete}
                    taskTitle={task.title}
                />
            </div>
        </div>
    )
}
