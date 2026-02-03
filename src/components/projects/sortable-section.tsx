'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SectionHeader } from './section-header'
import { SortableTaskList } from '@/components/tasks/sortable-task-list'
import { CreateTaskInline } from '@/components/tasks/create-task-inline'

interface SortableSectionProps {
    section: any
    activeTasks: any[]
    completedTasks: any[]
    projectId: string
}

export function SortableSection({
    section,
    activeTasks,
    completedTasks,
    projectId,
}: SortableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 1,
    }

    const totalTasks = activeTasks.length + completedTasks.length

    return (
        <div ref={setNodeRef} style={style} className="mb-8">
            <SectionHeader
                section={section}
                taskCount={totalTasks}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
                dragHandleProps={{ ...attributes, ...listeners }}
            />

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    {/* Active Tasks in Section */}
                    {activeTasks.length > 0 && (
                        <div className="mb-4 ml-8">
                            <SortableTaskList tasks={activeTasks} />
                        </div>
                    )}

                    {/* Section Quick Add */}
                    <div className="mb-3 ml-8">
                        <CreateTaskInline
                            defaultProjectId={projectId}
                            defaultSectionId={section.id}
                            placeholder={`Add a task to ${section.name}...`}
                            variant="compact"
                        />
                    </div>

                    {/* Completed Tasks in Section */}
                    {completedTasks.length > 0 && (
                        <div className="ml-8">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Completed
                            </h4>
                            <SortableTaskList tasks={completedTasks} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
