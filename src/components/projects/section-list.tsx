'use client'

import { useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableSection } from './sortable-section'
import { reorderSections } from '@/lib/actions/sections'
import { toast } from 'sonner'

interface SectionListProps {
    initialSections: any[]
    tasksBySection: Record<string, any[]>
    projectId: string
}

export function SectionList({
    initialSections,
    tasksBySection,
    projectId,
}: SectionListProps) {
    const [sections, setSections] = useState(initialSections)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = sections.findIndex((i) => i.id === active.id)
            const newIndex = sections.findIndex((i) => i.id === over?.id)

            const newSections = arrayMove(sections, oldIndex, newIndex)

            setSections(newSections)

            // Trigger server action to persist order
            try {
                await reorderSections(projectId, newSections.map(s => s.id))
            } catch (error) {
                toast.error('Failed to update section order')
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col">
                    {sections.map((section) => {
                        const sectionTasks = tasksBySection[section.id] || []
                        const activeTasks = sectionTasks.filter((t: any) => !t.completed)
                        const completedTasks = sectionTasks.filter((t: any) => t.completed)

                        return (
                            <SortableSection
                                key={section.id}
                                section={section}
                                activeTasks={activeTasks}
                                completedTasks={completedTasks}
                                projectId={projectId}
                            />
                        )
                    })}
                </div>
            </SortableContext>
        </DndContext>
    )
}
