'use client'

import { Check, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'

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
        isRecurring?: boolean
    }
}

export function CompletedTaskRow({ task }: CompletedTaskRowProps) {
    const { selectTask } = useTaskDetailStore()

    const priorityConfig = {
        urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        high: { label: 'High', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        low: { label: 'Low', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' }
    }

    const projectColors = {
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
        neutral: 'bg-zinc-400'
    }

    const priority = task.priority?.toLowerCase() as keyof typeof priorityConfig | undefined
    const priorityStyle = priority ? priorityConfig[priority] : null

    const formattedDate = () => {
        const date = new Date(task.completedAt)
        if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
        if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`
        return format(date, 'MMM d · h:mm a')
    }

    const handleClick = () => {
        selectTask(task.id, task)
    }

    return (
        <div
            onClick={handleClick}
            className="group flex items-center justify-between p-4 hover:bg-muted/40 transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
                {/* Checkmark */}
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white shrink-0 shadow-sm ring-1 ring-green-600/20">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>

                {/* Title & Project */}
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        {task.isRecurring && (
                            <Repeat className="h-3 w-3 text-muted-foreground/70" />
                        )}
                        <span className="text-sm font-medium text-foreground truncate">
                            {task.title}
                        </span>
                    </div>

                    {task.project && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                projectColors[(task.project.color || 'neutral') as keyof typeof projectColors]
                            )} />
                            <span className="text-xs text-muted-foreground">
                                {task.project.name}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Metadata (Right Side) */}
            <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                    {formattedDate()}
                </span>

                {priorityStyle && (
                    <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
                        priorityStyle.className
                    )}>
                        {priorityStyle.label}
                    </span>
                )}
            </div>
        </div>
    )
}
