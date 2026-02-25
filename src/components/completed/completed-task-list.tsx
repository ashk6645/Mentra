'use client'

import { CompletedTaskRow } from './completed-task-row'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

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
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2
                    }}
                    className="flex justify-center items-center w-24 h-24 rounded-full bg-green-50 dark:bg-green-950/30 text-green-500 mb-6 ring-8 ring-green-50/50 dark:ring-green-900/10"
                >
                    <CheckCircle className="w-10 h-10" />
                </motion.div>
                <motion.h3
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="text-lg font-semibold text-foreground mb-2"
                >
                    No Completed Tasks
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="text-[15px] text-muted-foreground/80 max-w-xs mb-6"
                >
                    Your meaningful achievements and finished history will appear here.
                </motion.p>
            </motion.div>
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
