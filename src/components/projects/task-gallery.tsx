"use client"

import React from 'react'
import { Task } from '@prisma/client'
import { TaskCard } from '@/components/tasks/task-card'

interface TaskGalleryProps {
    tasks: Task[]
}

export function TaskGallery({ tasks }: TaskGalleryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1 overflow-y-auto min-h-0">
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                    <p>No tasks found in this project.</p>
                </div>
            )}
        </div>
    )
}
