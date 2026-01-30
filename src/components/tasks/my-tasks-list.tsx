'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { useState } from 'react'
import { isToday, isFuture, isPast, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface MyTasksListProps {
    tasks: any[]
}

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue'

export function MyTasksList({ tasks }: MyTasksListProps) {
    const [filter, setFilter] = useState<FilterType>('all')

    const filteredTasks = tasks.filter(task => {
        // Filter logic based on tab selection

        switch (filter) {
            case 'today':
                // Show tasks due today (regardless of status)
                return task.dueDate && isToday(new Date(task.dueDate))

            case 'upcoming':
                // Show future tasks (regardless of status, though usually pending)
                return task.dueDate && isFuture(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))

            case 'overdue':
                // Overdue items are strict: Past due AND Incomplete
                return !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))

            case 'all':
            default:
                // Show everything
                return true
        }
    })

    const filters: { id: FilterType; label: string; count?: number }[] = [
        { id: 'all', label: 'All', count: tasks.length },
        { id: 'today', label: 'Today', count: tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length },
        { id: 'upcoming', label: 'Upcoming', count: tasks.filter(t => t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length },
        { id: 'overdue', label: 'Overdue', count: tasks.filter(t => !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length }
    ]

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg w-fit">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                            "relative px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                            filter === f.id
                                ? "text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        {filter === f.id && (
                            <motion.div
                                layoutId="activeFilter"
                                className="absolute inset-0 bg-background rounded-md shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {f.label}
                            {f.count !== undefined && f.count > 0 && (
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/10",
                                    f.id === 'overdue' && "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {f.count}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                    <p>No {filter !== 'all' ? filter : ''} tasks found.</p>
                </div>
            ) : (
                <SortableTaskList tasks={filteredTasks} />
            )}
        </div>
    )
}
