'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Task {
    id: string
    title: string
    description?: string | null
    completed: boolean
    dueDate?: Date | null
    priority?: string | null
    project?: {
        name: string
        color?: string | null
    } | null
}

interface FocusWidgetProps {
    tasks: Task[]
}

export function FocusWidget({ tasks }: FocusWidgetProps) {
    const priorityMap = {
        urgent: 'bg-red-500',
        high: 'bg-orange-500',
        medium: 'bg-yellow-500',
        low: 'bg-blue-500'
    }

    return (
        <Card className="h-full border-none shadow-sm bg-card flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium">Today's Focus</CardTitle>
                <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {tasks.length} Tasks
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.slice(0, 4).map((task) => (
                            <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                                <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                                    <Circle className="h-5 w-5" />
                                </button>
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium leading-none group-hover:text-primary transition-colors">
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {task.project && (
                                            <span className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${task.project.color ? '' : 'bg-primary'}`} style={{ backgroundColor: task.project.color || undefined }} />
                                                {task.project.name}
                                            </span>
                                        )}
                                        {task.dueDate && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {task.priority && (
                                    <div className={`w-1.5 h-1.5 rounded-full mt-2 ${(priorityMap as any)[task.priority]}`} />
                                )}
                            </div>
                        ))}
                        {tasks.length > 4 && (
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground" asChild>
                                <Link href="/tasks">View {tasks.length - 4} more</Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm">No tasks for today</p>
                        <Button variant="link" asChild className="mt-2 h-auto p-0">
                            <Link href="/tasks">Add a task</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
