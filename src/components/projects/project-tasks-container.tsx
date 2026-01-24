"use client"

import React, { useState } from 'react'
import { Task } from '@prisma/client'
import { TaskBoard } from '@/components/board/TaskBoard'
import { TaskViewSwitcher, TaskViewType } from './task-view-switcher'
import { TaskTable } from './task-table'
import { TaskGallery } from './task-gallery'
import { Card } from '@/components/ui/card' // Placeholder for now

interface ProjectTasksContainerProps {
    tasks: any[] // Using any for now to handle relations if needed, typically (Task & { tags: ... })[]
    sections: any[]
    projectId: string
}

export function ProjectTasksContainer({ tasks, sections, projectId }: ProjectTasksContainerProps) {
    const [view, setView] = useState<TaskViewType>('board')

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-1">
                <TaskViewSwitcher currentView={view} onViewChange={setView} />
                {/* Add Filter/Search here later if needed */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden min-h-0">
                {view === 'board' && (
                    <TaskBoard tasks={tasks} sections={sections} projectId={projectId} />
                )}

                {view === 'table' && (
                    <TaskTable tasks={tasks} />
                )}

                {view === 'gallery' && (
                    <TaskGallery tasks={tasks} />
                )}
            </div>
        </div>
    )
}
