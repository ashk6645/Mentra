'use client'

import { motion } from 'framer-motion'
import { CalendarDays, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { format, isSameDay, addDays } from 'date-fns'

interface Task {
    id: string
    title: string
    priority: string
    dueDate: Date | null
}

interface UpcomingWidgetProps {
    tasks: Task[]
}

export function UpcomingWidget({ tasks }: UpcomingWidgetProps) {
    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Upcoming</h3>
            </div>

            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                        No upcoming deadlines
                    </div>
                ) : (
                    tasks.map((task, index) => {
                        const isTomorrow = task.dueDate && isSameDay(new Date(task.dueDate), addDays(new Date(), 1))

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3 text-sm"
                            >
                                <div className="mt-1">
                                    {task.priority === 'urgent' || task.priority === 'high' ? (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-1.5" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <p className="font-medium line-clamp-1">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isTomorrow ? 'Tomorrow' : task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </Card>
    )
}
