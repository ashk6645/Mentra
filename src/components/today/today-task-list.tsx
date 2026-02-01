'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'

interface TodayTaskListProps {
    tasks: any[]
}

export function TodayTaskList({ tasks }: TodayTaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-base font-medium">No tasks scheduled for today</p>
                <p className="text-sm mt-1 opacity-70">Add a task to get started</p>
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
