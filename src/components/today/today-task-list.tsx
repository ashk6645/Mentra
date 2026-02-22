'use client'

import { useState, useEffect } from 'react'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'
import { AllDoneAnimation } from '@/components/ui/all-done-animation'

interface TodayTaskListProps {
    tasks: any[]
}

export function TodayTaskList({ tasks: initialTasks }: TodayTaskListProps) {
    // Keep track of optimistic task count to show animation instantly
    const [optimisticCount, setOptimisticCount] = useState(initialTasks.length)

    // Reset when server prop changes
    useEffect(() => {
        setOptimisticCount(initialTasks.length)
    }, [initialTasks])

    if (optimisticCount === 0) {
        return (
            <AllDoneAnimation />
        )
    }

    return <SortableTaskList
        tasks={initialTasks}
        onOptimisticEmpty={() => setOptimisticCount(0)}
    />
}
