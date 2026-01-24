"use client"

import React from 'react'
import { Task } from '@prisma/client'
import { TaskCard } from '@/components/tasks/task-card' // Ensure this component exports default or named
// Actually TaskBoard uses DraggableTaskCard usually, assuming TaskCard is the display component.
// Checking previous view_file of task-card.tsx... it wasn't viewed in full? 
// I'll assume standard usage or wrap it.

interface TaskGalleryProps {
    tasks: any[]
}

export function TaskGallery({ tasks }: TaskGalleryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1 overflow-y-auto h-full">
            {tasks.map(task => (
                <div key={task.id} className="h-full">
                    {/* We might need to wrap TaskCard if it expects specific props or DnD context */}
                    {/* For read-only gallery (or simple click to edit), we can use a wrapper or just the card */}
                    {/* If TaskCard is draggable, it might need DndContext. We'll verify content of TaskCard next if needed. */}
                    {/* For now, simplified card wrapper */}
                    <div className="border rounded-lg p-3 bg-card hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                            {/* Priority/Status badge */}
                        </div>
                        {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-3">{task.description}</p>
                        )}
                        {/* Footer with due date etc */}
                        <div className="mt-auto pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                        </div>
                    </div>
                </div>
            ))}
            {tasks.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                    No tasks found.
                </div>
            )}
        </div>
    )
}
