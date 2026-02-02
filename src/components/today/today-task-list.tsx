'use client'

import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'

interface TodayTaskListProps {
    tasks: any[]
}

export function TodayTaskList({ tasks }: TodayTaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                {/* Friendly visual */}
                <div className="relative mb-6">
                    <div className="text-7xl opacity-80 animate-bounce" style={{ animationDuration: '3s' }}>
                        ☀️
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm">
                        ✨
                    </div>
                </div>
                
                {/* Encouraging copy */}
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    All clear for today!
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                    No tasks scheduled. Take a break, or plan something meaningful.
                </p>
                
                {/* Clear action */}
                <CreateTaskInline variant="compact" label="Schedule a task" />
            </div>
        )
    }

    return <SortableTaskList tasks={tasks} />
}
