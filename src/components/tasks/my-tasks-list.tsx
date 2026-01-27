'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CheckCircle2 } from 'lucide-react'

interface MyTasksListProps {
    tasks: any[]
}

export function MyTasksList({ tasks }: MyTasksListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-dashed">
                No tasks found. Add one to get started!
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
