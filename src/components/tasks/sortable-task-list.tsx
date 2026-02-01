'use client'

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect, useRef, useId } from 'react'
import { TaskRow } from './task-row'
import { updateTaskOrder } from '@/lib/actions/tasks'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableTaskListProps {
    tasks: any[]
}

function SortableTaskItem({ task }: { task: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-2 transition-opacity",
                isDragging && "opacity-50"
            )}
        >
            {/* 6-dot drag handle - hidden by default, visible on hover */}
            <div
                {...attributes}
                {...listeners}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing touch-none shrink-0"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>

            <div className="flex-1 min-w-0">
                <TaskRow task={task} />
            </div>
        </div>
    )
}

export function SortableTaskList({ tasks: initialTasks }: SortableTaskListProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [activeId, setActiveId] = useState<string | null>(null)
    const pendingUpdateRef = useRef<{ id: string; sortOrder: number; sectionId?: string | null }[] | null>(null)
    const contextId = useId() // Generate unique ID for this component instance

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    // Handle database updates outside of render cycle
    useEffect(() => {
        if (pendingUpdateRef.current) {
            updateTaskOrder(pendingUpdateRef.current).catch(console.error)
            pendingUpdateRef.current = null
        }
    }, [tasks])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragStart(event: DragEndEvent) {
        setActiveId(event.active.id as string)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)

        if (active.id !== over?.id) {
            setTasks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over?.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                // Store update for useEffect to handle
                pendingUpdateRef.current = newItems.map((task, index) => ({
                    id: task.id,
                    sortOrder: index,
                    sectionId: task.sectionId
                }))

                return newItems
            })
        }
    }

    function handleDragCancel() {
        setActiveId(null)
    }

    if (tasks.length === 0) {
        return null
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

    return (
        <DndContext
            id={contextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext
                items={tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-[2px]">
                    {tasks.map((task) => (
                        <SortableTaskItem key={task.id} task={task} />
                    ))}
                </div>
            </SortableContext>

            {/* Drag overlay for smooth animation */}
            <DragOverlay>
                {activeTask ? (
                    <div className="shadow-lg opacity-90">
                        <TaskRow task={activeTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
