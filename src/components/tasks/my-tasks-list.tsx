'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CheckCircle2 } from 'lucide-react'

interface MyTasksListProps {
    tasks: any[]
}

export function MyTasksList({ tasks }: MyTasksListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-muted/50 p-4 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                    <p className="font-medium text-foreground">No tasks yet</p>
                    <p className="text-sm text-muted-foreground">Add a task to get started on your journey.</p>
                </div>
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
