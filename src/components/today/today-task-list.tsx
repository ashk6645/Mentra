'use client'

import { TaskRow } from '@/components/tasks/task-row'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'

interface TodayTaskListProps {
    tasks: any[]
}

export function TodayTaskList({ tasks }: TodayTaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                No tasks scheduled for today.
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
