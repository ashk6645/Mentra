'use client'

import { useState } from 'react'
import { Task } from '@prisma/client'
import { format, isToday, isTomorrow } from 'date-fns'
import { Clock, MoreHorizontal, Trash, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface TaskCardProps {
    task: Task
}

export function TaskCard({ task }: { task: Task & { tags?: { tag: { id: string, name: string, color: string | null } }[], subtasks?: any[] } }) {
    const router = useRouter()
    const [isThinking, setIsThinking] = useState(false)
    const { selectTask, selectedTaskId } = useTaskDetailStore()
    const isSelected = selectedTaskId === task.id

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

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
        if ((e.target as HTMLElement).closest('[data-radix-collection-item]')) return
        if ((e.target as HTMLElement).closest('button')) return
        if (e.defaultPrevented) return

        selectTask(task.id, task)
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
    const hasSubtasks = task.subtasks && task.subtasks.length > 0
    const completedSubtasks = hasSubtasks ? task.subtasks!.filter((st: any) => st.completed).length : 0
    const totalSubtasks = hasSubtasks ? task.subtasks!.length : 0

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group relative flex items-center gap-3 px-4 py-3.5 bg-card border border-border/20 rounded-lg cursor-pointer transition-colors hover:bg-accent/5",
                task.completed && "bg-muted/30"
            )}>
            
            {/* Left accent bar - only shows when selected */}
            {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
            )}
            
            {/* Checkbox */}
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <Checkbox
                    checked={task.completed}
                    onCheckedChange={handleToggle}
                    className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    disabled={isThinking}
                />
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
                    <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2">
                        {task.description}
                    </p>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                        {task.tags.map(({ tag }) => (
                            <Badge key={tag.id} variant="secondary" className="h-5 px-2 text-[10px] font-medium">
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Right side metadata */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Due date */}
                {dueDateInfo && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs font-medium",
                        dueDateInfo.isOverdue ? "text-red-500" : "text-muted-foreground"
                    )}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{dueDateInfo.text}</span>
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
                            onClick={handleDelete}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
