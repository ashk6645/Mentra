'use client'

import { Task } from '@prisma/client'
import { TaskEditForm } from '@/components/tasks/task-edit-form'
import { Button } from '@/components/ui/button'
import { X, Layout } from 'lucide-react'

interface TaskDetailViewProps {
    taskId: string | null
    task: any | null // Using any because of the complex include types
    onClose: () => void
}

export function TaskDetailView({ taskId, task, onClose }: TaskDetailViewProps) {
    if (!taskId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 text-muted-foreground/60">
                <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
                    <Layout className="h-8 w-8 opacity-50" />
                </div>
                <div className="space-y-1">
                    <p className="font-medium text-foreground">No task selected</p>
                    <p className="text-sm">Select a task to view details</p>
                </div>
            </div>
        )
    }

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground/60">
                <p>Task not found</p>
                <Button variant="link" onClick={onClose}>Close</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="text-xs font-medium text-muted-foreground">
                    {task.project ? task.project.name : 'Inbox'}
                    {task.sectionId ? ' / Section' : ''}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content (Form) */}
            <div className="flex-1 overflow-y-auto">
                <TaskEditForm task={task} />
            </div>
        </div>
    )
}
