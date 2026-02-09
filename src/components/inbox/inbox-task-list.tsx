'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'

interface InboxTaskListProps {
    tasks: any[]
}

export function InboxTaskList({ tasks }: InboxTaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                {/* Friendly visual */}
                <div className="relative mb-6">
                    <div className="text-7xl opacity-80">📥</div>
                    {/* <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm">
                        ✨
                    </div> */}
                </div>
                
                {/* Encouraging copy */}
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Inbox Zero!
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                    All caught up. New tasks will appear here when they arrive.
                </p>
                
                {/* Clear action */}
                {/* <CreateTaskInline variant="compact" label="Add a task" /> */}
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
