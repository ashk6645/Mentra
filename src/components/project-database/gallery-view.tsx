'use client'

import React from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core'
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    MoreHorizontal,
    Plus,
    Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectDatabase } from './project-database-context'
import { PriorityBadge, ProgressBar, AreaBadge, StatusBadge } from './cell-renderers'
import {
    ProjectDatabaseItem,
} from './types'

// ========================================
// GALLERY VIEW
// ========================================

interface GalleryViewProps {
    onProjectClick?: (project: ProjectDatabaseItem) => void
}

export function GalleryView({ onProjectClick }: GalleryViewProps) {
    const {
        projects,
        areas,
        deleteProject,
        createProject
    } = useProjectDatabase()

    const [activeId, setActiveId] = React.useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null)
        // Implement reordering logic if sorting by manual order
    }

    const activeProject = activeId ? projects.find(p => p.id === activeId) : null

    return (
        <div className="h-full overflow-y-auto p-6">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
                        {projects.map((project) => (
                            <SortableGalleryCard
                                key={project.id}
                                project={project}
                                areas={areas}
                                onClick={() => onProjectClick?.(project)}
                                onDelete={() => deleteProject(project.id)}
                            />
                        ))}
                    </SortableContext>

                    {/* New Project Button Card */}
                    <button
                        onClick={() => createProject({ name: 'Untitled Project' })}
                        className="flex flex-col items-center justify-center gap-2 h-48 border border-dashed border-border rounded-xl hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="w-8 h-8 opacity-50" />
                        <span className="text-sm font-medium">New Project</span>
                    </button>
                </div>

                <DragOverlay>
                    {activeProject ? (
                        <GalleryCard
                            project={activeProject}
                            areas={areas}
                            isDragging
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}

// ========================================
// SORTABLE GALLERY CARD
// ========================================

interface SortableGalleryCardProps {
    project: ProjectDatabaseItem
    areas: { id: string; name: string; color: string | null }[]
    onClick?: () => void
    onDelete?: () => void
}

function SortableGalleryCard({ project, areas, onClick, onDelete }: SortableGalleryCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <GalleryCard
                project={project}
                areas={areas}
                onClick={onClick}
                onDelete={onDelete}
            />
        </div>
    )
}

// ========================================
// GALLERY CARD
// ========================================

interface GalleryCardProps {
    project: ProjectDatabaseItem
    areas: { id: string; name: string; color: string | null }[]
    onClick?: () => void
    onDelete?: () => void
    isDragging?: boolean
}

function GalleryCard({
    project,
    areas,
    onClick,
    onDelete,
    isDragging,
}: GalleryCardProps) {
    const area = areas.find(a => a.id === project.areaId)

    return (
        <Card
            className={cn(
                "group relative flex flex-col h-48 overflow-hidden cursor-pointer transition-all hover:shadow-md border-border/60",
                isDragging && "shadow-xl ring-2 ring-primary/20 scale-105 z-50",
                !isDragging && "hover:-translate-y-1"
            )}
            onClick={onClick}
        >
            {/* Cover Image Simulation (or actual if present) */}
            <div className={cn(
                "h-20 w-full bg-gradient-to-r shrink-0",
                project.color === 'red' ? "from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20" :
                    project.color === 'blue' ? "from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20" :
                        project.color === 'green' ? "from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20" :
                            project.color === 'purple' ? "from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20" :
                                project.color === 'orange' ? "from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20" :
                                    "from-zinc-100 to-zinc-50 dark:from-zinc-800/40 dark:to-zinc-800/20"
            )} />

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col gap-2 bg-card/50">
                {/* Icon & Title - Overlapping Header */}
                <div className="-mt-8 flex items-end gap-2 mb-1">
                    <div className="w-10 h-10 rounded-lg bg-background shadow-sm border border-border flex items-center justify-center text-xl shrink-0">
                        {project.icon || '📄'}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate mb-1">
                        {project.name || 'Untitled'}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={project.status} size="sm" />
                        <PriorityBadge priority={project.priority} size="sm" />
                        {area && <AreaBadge area={area} size="sm" />}
                    </div>
                </div>

                {/* Footer */}
                {(project.targetDate || project.progress > 0) && (
                    <div className="mt-auto pt-2 border-t border-border/30 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        {project.targetDate ? (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(project.targetDate), 'MMM d')}
                            </div>
                        ) : <div></div>}

                        {project.progress > 0 && (
                            <div className="w-16">
                                <ProgressBar value={project.progress} size="sm" showLabel={false} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 bg-background/50 backdrop-blur-sm shadow-sm border border-border/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onClick}>Open</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete?.()
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    )
}
