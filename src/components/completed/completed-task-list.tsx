'use client'

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

function TaskGroup({ title, tasks }: { title: string, tasks: CompletedTask[] }) {
    if (tasks.length === 0) return null
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-muted-foreground ml-1">{title}</h3>
            <div className="bg-card border rounded-xl shadow-sm divide-y divide-border/50 overflow-hidden">
                {tasks.map(task => (
                    <CompletedTaskRow key={task.id} task={task} />
                ))}
            </div>
        </div>
    )
}

export function CompletedTaskList({ groupedTasks }: CompletedTaskListProps) {
    const { today, yesterday, older } = groupedTasks
    const olderDates = Object.keys(older).sort((a, b) => b.localeCompare(a)) // Sort desc
    const totalTasks = today.length + yesterday.length + olderDates.reduce((sum, date) => sum + older[date].length, 0)

    if (totalTasks === 0) {
        return (
            <div className="text-center py-16 space-y-4">
                <div className="text-5xl opacity-50">✨</div>
                <div className="space-y-1">
                    <p className="text-lg font-medium text-foreground/80">No completed tasks yet</p>
                    <p className="text-sm text-muted-foreground">
                        Your meaningful achievements will appear here.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <TaskGroup title="Today" tasks={today} />
            <TaskGroup title="Yesterday" tasks={yesterday} />

            {olderDates.map(dateKey => {
                const date = new Date(dateKey)
                const title = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                return <TaskGroup key={dateKey} title={title} tasks={older[dateKey]} />
            })}
        </div>
    )
}
