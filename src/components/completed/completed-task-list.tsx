'use client'

import { DateGroupHeader } from './date-group-header'
import { CompletedTaskRow } from './completed-task-row'

interface CompletedTask {
    id: string
    title: string
    completedAt: Date
    priority?: string | null
    project?: {
        name: string
        color: string | null
    } | null
}

interface CompletedTaskListProps {
    groupedTasks: {
        today: CompletedTask[]
        yesterday: CompletedTask[]
        older: Record<string, CompletedTask[]>
    }
}

export function CompletedTaskList({ groupedTasks }: CompletedTaskListProps) {
    const { today, yesterday, older } = groupedTasks

    // Get sorted older dates (most recent first)
    const olderDates = Object.keys(older).sort((a, b) => b.localeCompare(a))

    const totalTasks = today.length + yesterday.length + olderDates.reduce((sum, date) => sum + older[date].length, 0)

    if (totalTasks === 0) {
        return (
            <div className="text-center py-16 space-y-3">
                <div className="text-4xl">🎯</div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/80">No completed tasks yet</p>
                    <p className="text-xs text-muted-foreground">
                        Start checking off tasks to build your progress history!
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Today */}
            {today.length > 0 && (
                <div>
                    <DateGroupHeader
                        date={new Date()}
                        type="today"
                        taskCount={today.length}
                    />
                    <div className="space-y-1">
                        {today.map(task => (
                            <CompletedTaskRow key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            )}

            {/* Yesterday */}
            {yesterday.length > 0 && (
                <div>
                    <DateGroupHeader
                        date={new Date(Date.now() - 86400000)}
                        type="yesterday"
                        taskCount={yesterday.length}
                    />
                    <div className="space-y-1">
                        {yesterday.map(task => (
                            <CompletedTaskRow key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            )}

            {/* Older dates */}
            {olderDates.map(dateKey => (
                <div key={dateKey}>
                    <DateGroupHeader
                        date={new Date(dateKey)}
                        type="date"
                        taskCount={older[dateKey].length}
                    />
                    <div className="space-y-1">
                        {older[dateKey].map(task => (
                            <CompletedTaskRow key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
