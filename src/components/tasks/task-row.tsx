'use client'

import { format, isToday, isTomorrow } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toggleTaskCompletion } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface TaskRowProps {
    task: {
        id: string
        title: string
        description?: string | null
        completed: boolean
        priority?: string | null
        dueDate?: Date | null
    }
}

export function TaskRow({ task }: TaskRowProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

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

    const getPriorityColor = (priority?: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'bg-red-500 text-white'
            case 'medium':
                return 'bg-orange-400 text-white'
            case 'low':
                return 'bg-blue-500 text-white'
            default:
                return 'bg-gray-500 text-white'
        }
    }

    const getPriorityLabel = (priority?: string | null) => {
        if (!priority) return ''
        // Capitalize first letter
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
                    "font-semibold text-base leading-none truncate",
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
                {hasPriority && (
                    <div className={cn(
                        "px-2.5 py-0.5 rounded text-xs font-semibold",
                        getPriorityColor(task.priority)
                    )}>
                        {getPriorityLabel(task.priority)}
                    </div>
                )}

                {task.dueDate && (
                    <div className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                        {formatDueDate(task.dueDate)}
                    </div>
                )}
            </div>
        </div>
    )
}
