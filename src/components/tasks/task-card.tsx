'use client'

import { useState } from 'react'
import { Task } from '@prisma/client'
import { format } from 'date-fns'
import { Calendar, Flag, MoreHorizontal, Trash, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
import { EditTaskDialog } from './edit-task-dialog'

interface TaskCardProps {
    task: Task
}

export function TaskCard({ task }: { task: Task & { tags?: { tag: { id: string, name: string, color: string | null } }[] } }) {
    const router = useRouter()
    const [isThinking, setIsThinking] = useState(false)

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
                task.completed && "opacity-50 bg-muted/30"
            )}>
                <Checkbox
                    checked={task.completed}
                    onCheckedChange={handleToggle}
                    className="mt-1"
                    disabled={isThinking}
                />

                <div className="flex-1 space-y-2">
                    {/* Typography: Body Large (16px, 500 weight) for task titles */}
                    <div className={cn(
                        "font-medium text-base leading-tight transition-quick cursor-pointer",
                        // Completion animation: strikethrough + fade (200ms)
                        task.completed && "line-through opacity-50"
                    )}>
                        {task.title}
                    </div>

                    {task.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Metadata: Small text (12px), tertiary color */}
                    <div className="flex items-center gap-4 pt-1 text-xs text-tertiary">
                        {task.dueDate && (
                            <div className={cn(
                                "flex items-center gap-1",
                                // Overdue gets destructive color (reserved for urgency)
                                task.dueDate < new Date() && !task.completed && "text-destructive font-medium"
                            )}>
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                        )}

                        {task.priority && (
                            <div className="flex items-center text-muted-foreground">
                                <Flag className="mr-1 h-3 w-3" />
                                <span className="capitalize">{task.priority}</span>
                            </div>
                        )}

                        {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 ml-2">
                                {task.tags.map(({ tag }) => (
                                    <Badge key={tag.id} variant="secondary" className="h-5 px-1.5 text-[10px]">
                                        {tag.name}
                                    </Badge>
                                ))}
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
                        <EditTaskDialog
                            task={task}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            }
                        />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    )
}
