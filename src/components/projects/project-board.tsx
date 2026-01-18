'use client'

import { useState } from 'react'
import {
    Project,
    Section,
    Task,
    Tag as TagType
} from '@prisma/client'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from '@/components/tasks/task-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, GripVertical, MoreHorizontal, Trash } from 'lucide-react'
import { createSection, deleteSection, updateSectionOrder } from '@/lib/actions/sections'
import { updateTask, updateTaskOrder } from '@/lib/actions/tasks'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type TaskWithRelations = Task & {
    subTasks?: Task[],
    tags?: { tag: TagType }[]
}

type SectionWithTasks = Section & {
    tasks: TaskWithRelations[]
}

type ActiveDragItemData =
    | { type: 'Section'; section: Section }
    | { type: 'Task'; task: TaskWithRelations }

interface ProjectBoardProps {
    project: Project & {
        sections: SectionWithTasks[]
        tasks: TaskWithRelations[] // Uncategorized tasks
    }
}

function SortableSection({ section, tasks }: { section: Section, tasks: TaskWithRelations[] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: section.id,
        data: {
            type: 'Section',
            section
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleDelete = async () => {
        if (confirm('Delete this section?')) {
            await deleteSection(section.id, section.projectId)
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("w-80 flex-shrink-0 flex flex-col max-h-full bg-muted/10 rounded-lg border", isDragging && "opacity-50")}
        >
            <div className="p-3 font-medium flex items-center justify-between cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{section.name}</span>
                    <span className="text-xs text-muted-foreground">{tasks.length}</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Delete Section
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        // We wrap TaskCard in a Sortable Item
                        <SortableTask key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}

function SortableTask({ task }: { task: TaskWithRelations }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-50")}>
            <TaskCard task={task} />
        </div>
    )
}

export function ProjectBoard({ project }: ProjectBoardProps) {
    const [sections, setSections] = useState(project.sections)
    const [uncategorizedTasks, setUncategorizedTasks] = useState(project.tasks)

    // Create a virtual "uncategorized" section for DnD logic
    const uncategorizedSectionId = 'uncategorized'

    const [activeDragItem, setActiveDragItem] = useState<any>(null)
    const [newSectionName, setNewSectionName] = useState('')

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSectionName.trim()) return
        await createSection({ projectId: project.id, name: newSectionName })
        setNewSectionName('')
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveDragItem(active.data.current)
        setActiveDragItem(active.data.current as ActiveDragItemData)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = String(active.id)
        const overId = String(over.id)

        // Find containers
        const activeContainer = findContainer(activeId)
        const overContainer = findContainer(overId)

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return
        }

        // Move task to new container during drag (optimistic)
        if (active.data.current?.type === 'Task') {
            setSections((prev) => {
                return prev
            })
        }
    }

    // Helper to find which section a task belongs to
    function findContainer(id: string) {
        if (uncategorizedTasks.find(t => t.id === id)) return uncategorizedSectionId
        if (id === uncategorizedSectionId) return uncategorizedSectionId

        const section = sections.find(s => s.id === id || s.tasks.find(t => t.id === id))
        return section ? section.id : null
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveDragItem(null)

        if (!over) return

        const activeId = String(active.id)
        const overId = String(over.id)
        const activeType = active.data.current?.type
        const overType = over.data.current?.type

        // 1. Section Reordering
        if (activeType === 'Section' && overType === 'Section') {
            const oldIndex = sections.findIndex((s) => s.id === activeId)
            const newIndex = sections.findIndex((s) => s.id === overId)

            if (oldIndex !== newIndex) {
                const newSections = arrayMove(sections, oldIndex, newIndex)
                setSections(newSections)
                await updateSectionOrder(newSections.map((s, i) => ({ id: s.id, sortOrder: i })), project.id)
            }
            return
        }

        // 2. Task Reordering / Moving
        if (activeType === 'Task') {
            const activeContainer = findContainer(activeId)
            const overContainer = findContainer(overId)

            if (!activeContainer || !overContainer) return

            // Move within same container
            if (activeContainer === overContainer) {
                if (activeContainer === uncategorizedSectionId) {
                    const oldIndex = uncategorizedTasks.findIndex(t => t.id === activeId)
                    const newIndex = uncategorizedTasks.findIndex(t => t.id === overId)
                    if (oldIndex !== newIndex) {
                        const newTasks = arrayMove(uncategorizedTasks, oldIndex, newIndex)
                        setUncategorizedTasks(newTasks)
                        await updateTaskOrder(newTasks.map((t, i) => ({ id: t.id, sortOrder: i, sectionId: null })))
                    }
                } else {
                    const sectionIndex = sections.findIndex(s => s.id === activeContainer)
                    const section = sections[sectionIndex]
                    const oldIndex = section.tasks.findIndex(t => t.id === activeId)
                    const newIndex = section.tasks.findIndex(t => t.id === overId)

                    if (oldIndex !== newIndex) {
                        const newTasks = arrayMove(section.tasks, oldIndex, newIndex)
                        const newSections = [...sections]
                        newSections[sectionIndex] = { ...section, tasks: newTasks }
                        setSections(newSections)
                        await updateTaskOrder(newTasks.map((t, i) => ({ id: t.id, sortOrder: i, sectionId: section.id })))
                    }
                }
            }
            // Move to different container
            else {
                // Remove from old
                let taskToMove: TaskWithRelations | undefined
                let newSections = [...sections]
                let newUncategorized = [...uncategorizedTasks]

                if (activeContainer === uncategorizedSectionId) {
                    taskToMove = newUncategorized.find(t => t.id === activeId)
                    newUncategorized = newUncategorized.filter(t => t.id !== activeId)
                    setUncategorizedTasks(newUncategorized)
                } else {
                    const sIndex = newSections.findIndex(s => s.id === activeContainer)
                    taskToMove = newSections[sIndex].tasks.find(t => t.id === activeId)
                    newSections[sIndex] = {
                        ...newSections[sIndex],
                        tasks: newSections[sIndex].tasks.filter(t => t.id !== activeId)
                    }
                }

                if (!taskToMove) return

                // Add to new
                if (overContainer === uncategorizedSectionId) {
                    // Add to specific index if overTask, else end
                    const overIndex = newUncategorized.findIndex(t => t.id === overId)
                    const insertIndex = overIndex >= 0 ? overIndex : newUncategorized.length

                    newUncategorized.splice(insertIndex, 0, taskToMove)
                    setUncategorizedTasks(newUncategorized)
                    setSections(newSections) // Update sections too if removed from there

                    await updateTaskOrder(newUncategorized.map((t, i) => ({ id: t.id, sortOrder: i, sectionId: null })))
                } else {
                    const sIndex = newSections.findIndex(s => s.id === overContainer)
                    // If over is a task, find its index. If over is the section itself, add to end.
                    let insertIndex = newSections[sIndex].tasks.length
                    if (overType === 'Task') {
                        const overTaskIndex = newSections[sIndex].tasks.findIndex(t => t.id === overId)
                        if (overTaskIndex >= 0) insertIndex = overTaskIndex
                    }

                    newSections[sIndex].tasks.splice(insertIndex, 0, taskToMove)
                    newSections[sIndex] = { ...newSections[sIndex], tasks: [...newSections[sIndex].tasks] } // triggers update

                    setSections(newSections)
                    if (activeContainer === uncategorizedSectionId) setUncategorizedTasks(newUncategorized)

                    await updateTaskOrder(newSections[sIndex].tasks.map((t, i) => ({ id: t.id, sortOrder: i, sectionId: newSections[sIndex].id })))
                }
            }
        }
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                >
                    <div className="flex h-full gap-4 p-4 min-w-max align-top items-start">
                        <SortableContext items={sections.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                            {sections.map(section => (
                                <SortableSection key={section.id} section={section} tasks={section.tasks} />
                            ))}
                        </SortableContext>

                        {/* Uncategorized Column - Treat as a static droppable zone or sortable?
                            Let's make it a SortableContext too manually
                        */}
                        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                            {/* Add Section Form */}
                            <form onSubmit={handleCreateSection} className="flex gap-2">
                                <Input
                                    placeholder="New Section"
                                    className="bg-card"
                                    value={newSectionName}
                                    onChange={e => setNewSectionName(e.target.value)}
                                />
                                <Button type="submit" size="icon" variant="secondary">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </form>

                            {/* Uncategorized Tasks */}
                            {(uncategorizedTasks.length > 0 || activeDragItem && activeDragItem.type === 'Task') && (
                                <div className="p-4 border rounded-lg bg-muted/10 opacity-70 min-h-[100px]">
                                    <h3 className="font-semibold text-sm mb-2">Uncategorized</h3>
                                    <SortableContext
                                        id={uncategorizedSectionId}
                                        items={uncategorizedTasks.map(t => t.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {uncategorizedTasks.map(task => (
                                                <SortableTask key={task.id} task={task} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </div>
                            )}
                        </div>
                    </div>
                    <DragOverlay>
                        {activeDragItem?.type === 'Section' && (
                            <div className="w-80 p-4 border bg-background rounded-lg shadow-lg opacity-80">
                                {activeDragItem.section.name}
                            </div>
                        )}
                        {activeDragItem?.type === 'Task' && (
                            <div className="w-full opacity-80">
                                <TaskCard task={activeDragItem.task} />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    )
}
