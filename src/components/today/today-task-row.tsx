'use client'

import { TaskRow } from '@/components/tasks/task-row'

interface TodayTaskRowProps {
    task: {
        id: string
        title: string
        description?: string | null
        completed: boolean
        priority?: string | null
        dueDate?: Date | null
    }
}

export function TodayTaskRow({ task }: TodayTaskRowProps) {
    return <TaskRow task={task} />
}