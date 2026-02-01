'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'

interface InboxTaskListProps {
    tasks: any[]
}

export function InboxTaskList({ tasks }: InboxTaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-base font-medium">Your inbox is empty</p>
                <p className="text-sm mt-1 opacity-70">New tasks will appear here</p>
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
