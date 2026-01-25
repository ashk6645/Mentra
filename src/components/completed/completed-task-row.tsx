'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface CompletedTaskRowProps {
    task: {
        id: string
        title: string
        completedAt: Date
        priority?: string | null
        project?: {
            name: string
            color: string | null
        } | null
    }
}

export function CompletedTaskRow({ task }: CompletedTaskRowProps) {
    const priorityColors = {
        urgent: 'text-red-500',
        high: 'text-orange-500',
        medium: 'text-yellow-500',
        low: 'text-blue-500'
    }

    const projectColors = {
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
        neutral: 'bg-zinc-400'
    }

    return (
        <div className="group flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-muted/30 transition-colors">
            {/* Checkmark (always visible, read-only) */}
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/10 shrink-0">
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
            </div>

            {/* Task content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                        {task.title}
                    </span>

                    {/* Priority indicator */}
                    {task.priority && task.priority !== 'low' && (
                        <span className={cn(
                            "text-xs",
                            priorityColors[task.priority as keyof typeof priorityColors]
                        )}>
                            •
                        </span>
                    )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 mt-0.5">
                    {task.project && (
                        <div className="flex items-center gap-1.5">
                            <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                projectColors[(task.project.color || 'neutral') as keyof typeof projectColors]
                            )} />
                            <span className="text-xs text-muted-foreground/70">
                                {task.project.name}
                            </span>
                        </div>
                    )}
                    <span className="text-xs text-muted-foreground/50">
                        {format(new Date(task.completedAt), 'h:mm a')}
                    </span>
                </div>
            </div>
        </div>
    )
}
