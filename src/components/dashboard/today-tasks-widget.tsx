'use client'

import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Task {
    id: string
    title: string
    priority: string
    dueDate: Date | null
    project?: {
        name: string
        color: string
    } | null
}

interface TodayTasksWidgetProps {
    tasks: Task[]
    completedCount: number
}

export function TodayTasksWidget({ tasks, completedCount }: TodayTasksWidgetProps) {
    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Today's Focus</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{completedCount} completed</span>
                </div>
            </div>

            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No tasks remaining for today!</p>
                        <Button variant="link" size="sm">View completed tasks</Button>
                    </div>
                ) : (
                    tasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    task.priority === 'urgent' ? 'bg-red-500' :
                                        task.priority === 'high' ? 'bg-orange-500' :
                                            task.priority === 'medium' ? 'bg-blue-500' :
                                                'bg-zinc-500'
                                )} />

                                <div className="space-y-1">
                                    <p className="font-medium leading-none group-hover:text-primary transition-colors">{task.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {task.project && (
                                            <span
                                                className="px-1.5 py-0.5 rounded-full bg-opacity-10"
                                                style={{
                                                    backgroundColor: `${task.project.color}20`,
                                                    color: task.project.color
                                                }}
                                            >
                                                {task.project.name}
                                            </span>
                                        )}
                                        {task.dueDate && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(task.dueDate), 'h:mm a')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" className="group-hover:opacity-100 opacity-0 transition-opacity">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    ))
                )}
            </div>

            {tasks.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                    View all tasks
                </Button>
            )}
        </Card>
    )
}
