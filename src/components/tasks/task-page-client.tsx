'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ListTodo } from 'lucide-react'
import { MyTasksList } from '@/components/tasks/my-tasks-list'
import { InlineTaskInput } from '@/components/tasks/inline-task-input'
import { TaskDetailView } from '@/components/tasks/task-detail-view'
import { Task } from '@prisma/client'

interface TaskPageClientProps {
    initialTasks: any[]
    availableProjects?: any[]
    availableTags?: any[]
}

export function TaskPageClient({ initialTasks, availableProjects = [], availableTags = [] }: TaskPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get selected task ID from URL
    const selectedTaskId = searchParams.get('task')

    // Derived state for the selected task
    const selectedTask = selectedTaskId
        ? initialTasks.find(t => t.id === selectedTaskId)
        : null

    const handleTaskSelect = (taskId: string) => {
        // Update URL to current task
        const params = new URLSearchParams(searchParams.toString())
        params.set('task', taskId)
        router.push(`/tasks?${params.toString()}`)
    }

    const handleTaskCreated = (newTaskId: string) => {
        // Auto-select the newly created task
        handleTaskSelect(newTaskId)
    }

    const handleCloseDetail = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('task')
        router.push(`/tasks?${params.toString()}`)
    }

    // Auto-select first task if none selected
    useEffect(() => {
        if (!selectedTaskId && initialTasks.length > 0) {
            handleTaskSelect(initialTasks[0].id)
        }
    }, [selectedTaskId, initialTasks])

    return (
        <div className="flex h-full p-6 gap-6 bg-muted/20 overflow-hidden">
            {/* Left Pane - Task List Card */}
            <div className="flex-1 flex flex-col min-w-[320px] max-w-2xl bg-background rounded-2xl shadow-sm border overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b bg-background sticky top-0 z-10 shrink-0">
                    <ListTodo className="h-6 w-6 text-green-500" />
                    <h1 className="text-xl font-bold text-foreground">My Tasks</h1>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-background/50">
                    <div className="p-4 px-6 space-y-2">
                        <MyTasksList
                            tasks={initialTasks}
                            selectedTaskId={selectedTaskId || (initialTasks.length > 0 ? initialTasks[0].id : null)}
                            onSelectTask={handleTaskSelect}
                        />
                    </div>
                </div>

                {/* Fixed Input Area */}
                <div className="p-4 px-6 border-t bg-background shrink-0 z-10">
                    <InlineTaskInput
                        onTaskCreated={handleTaskCreated}
                        availableProjects={availableProjects}
                        availableTags={availableTags}
                    />
                </div>
            </div>

            {/* Right Pane - Task Details Card */}
            <div className="flex-1 max-w-3xl bg-background rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                <TaskDetailView
                    taskId={selectedTaskId}
                    task={selectedTask}
                    onClose={handleCloseDetail}
                />
            </div>
        </div>
    )
}
