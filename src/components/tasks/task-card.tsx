import { useState } from 'react'
import { Task } from '@prisma/client'
import { format, isToday, isTomorrow } from 'date-fns'
import { Calendar, Flag, MoreHorizontal, Trash, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
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

export function TaskCard({ task }: { task: Task & { tags?: { tag: { id: string, name: string, color: string | null } }[] } }) {
    const router = useRouter()
    const [isThinking, setIsThinking] = useState(false)
    const { selectTask } = useTaskDetailStore()

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
        // Prevent opening if clicking on checkbox or menu actions
        if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
        if ((e.target as HTMLElement).closest('[data-radix-collection-item]')) return
        if ((e.target as HTMLElement).closest('button')) return
        if (e.defaultPrevented) return

        selectTask(task.id, task)
    }

    const getPriorityStyles = (priority?: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-destructive'
            case 'high':
                return 'text-orange-600 dark:text-orange-500'
            case 'medium':
                return 'text-blue-600 dark:text-blue-500'
            case 'low':
                return 'text-muted-foreground'
            default:
                return 'text-muted-foreground'
        }
    }

    const getDueDateInfo = () => {
        if (!task.dueDate) return null
        const d = new Date(task.dueDate)
        const now = new Date()
        const isOverdue = d < now && !task.completed
        const isTodayDate = isToday(d)
        
        return { date: d, isOverdue, isToday: isTodayDate }
    }

    const dueDateInfo = getDueDateInfo()

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="space-y-2"
        >
            <div
                onClick={handleCardClick}
                className={cn(
                    "group relative flex items-start space-x-4 rounded-xl border border-border/50 p-4 bg-card cursor-pointer",
                    "transition-all duration-200 ease-out",
                    "hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]",
                    "hover:border-border/80 hover:-translate-y-0.5 hover:scale-[1.002]",
                    "active:scale-[0.998] active:transition-transform active:duration-100",
                    task.completed && "opacity-50 bg-muted/30"
                )}>
                
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-card to-card/98 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                
                <div onClick={(e) => e.stopPropagation()} className="relative z-10 pt-0.5">
                    <Checkbox
                        checked={task.completed}
                        onCheckedChange={handleToggle}
                        className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-200"
                        disabled={isThinking}
                    />
                </div>

                <div className="flex-1 space-y-2.5 relative z-10">
                    <h3 className={cn(
                        "font-medium text-base leading-tight transition-all duration-200",
                        task.completed && "line-through opacity-60"
                    )}>
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center flex-wrap gap-3 pt-1">
                        {dueDateInfo && (
                            <div className={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
                                dueDateInfo.isOverdue && "text-destructive bg-destructive/10",
                                dueDateInfo.isToday && !dueDateInfo.isOverdue && "text-warning bg-warning/10",
                                !dueDateInfo.isOverdue && !dueDateInfo.isToday && "text-muted-foreground bg-muted/50"
                            )}>
                                {dueDateInfo.isOverdue ? (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                ) : (
                                    <Calendar className="h-3.5 w-3.5" />
                                )}
                                {format(dueDateInfo.date, 'MMM d')}
                            </div>
                        )}

                        {task.priority && (
                            <div className={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-muted/50",
                                getPriorityStyles(task.priority)
                            )}>
                                <Flag className="h-3.5 w-3.5" />
                                <span className="capitalize">{task.priority}</span>
                            </div>
                        )}

                        {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1.5">
                                {task.tags.map(({ tag }) => (
                                    <Badge key={tag.id} variant="secondary" className="h-6 px-2 text-[10px] font-medium">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95 relative z-10"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Task actions menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                            onClick={handleDelete}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Task
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    )
}
