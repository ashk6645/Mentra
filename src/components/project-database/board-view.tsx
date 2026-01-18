'use client'

import React, { useCallback, useMemo, useState } from 'react'
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  MoreHorizontal, 
  Plus,
  GripVertical,
  Calendar,
  Flag,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectDatabase } from './project-database-context'
import { StatusBadge, PriorityBadge, ProgressBar, AreaBadge } from './cell-renderers'
import {
  ProjectDatabaseItem,
  ProjectStatus,
  ProjectPriority,
  BoardViewProps,
  PROJECT_STATUSES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from './types'

// ========================================
// BOARD VIEW
// ========================================

export function BoardView({ groupBy = 'status', onCardClick }: BoardViewProps) {
  const {
    projects,
    areas,
    updateProject,
    createProject,
    deleteProject,
  } = useProjectDatabase()
  
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  
  // Group projects by the selected field
  const groupedProjects = useMemo(() => {
    const groups: Record<string, ProjectDatabaseItem[]> = {}
    
    if (groupBy === 'status') {
      // Initialize all status columns
      Object.keys(PROJECT_STATUSES).forEach(status => {
        groups[status] = []
      })
      
      projects.forEach(project => {
        const key = project.status || 'ACTIVE'
        if (!groups[key]) groups[key] = []
        groups[key].push(project)
      })
    } else if (groupBy === 'priority') {
      // Initialize all priority columns
      Object.keys(PRIORITY_CONFIG).forEach(priority => {
        groups[priority] = []
      })
      
      projects.forEach(project => {
        const key = project.priority || 'MEDIUM'
        if (!groups[key]) groups[key] = []
        groups[key].push(project)
      })
    } else if (groupBy === 'area') {
      groups['none'] = []
      areas.forEach(area => {
        groups[area.id] = []
      })
      
      projects.forEach(project => {
        const key = project.areaId || 'none'
        if (!groups[key]) groups[key] = []
        groups[key].push(project)
      })
    }
    
    return groups
  }, [projects, groupBy, areas])
  
  // Get column config based on groupBy
  const getColumnConfig = useCallback((key: string) => {
    if (groupBy === 'status') {
      const config = STATUS_CONFIG[key as ProjectStatus]
      return {
        title: config?.label || key,
        color: config?.bgColor,
        borderColor: config?.borderColor,
      }
    } else if (groupBy === 'priority') {
      const config = PRIORITY_CONFIG[key as ProjectPriority]
      return {
        title: config?.label || key,
        color: config?.bgColor,
        icon: config?.icon,
      }
    } else if (groupBy === 'area') {
      if (key === 'none') {
        return { title: 'No Area', color: 'bg-muted' }
      }
      const area = areas.find(a => a.id === key)
      return {
        title: area?.name || 'Unknown',
        color: area?.color ? undefined : 'bg-muted',
        customColor: area?.color,
      }
    }
    return { title: key }
  }, [groupBy, areas])
  
  // Handle drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over) return
    
    const projectId = active.id as string
    const overId = over.id as string
    
    // Check if dropped on a column
    if (Object.keys(groupedProjects).includes(overId)) {
      const newValue = overId
      
      if (groupBy === 'status') {
        updateProject(projectId, { status: newValue as ProjectStatus })
      } else if (groupBy === 'priority') {
        updateProject(projectId, { priority: newValue as ProjectPriority })
      } else if (groupBy === 'area') {
        updateProject(projectId, { areaId: newValue === 'none' ? null : newValue })
      }
    }
  }
  
  // Get the active project for overlay
  const activeProject = activeId ? projects.find(p => p.id === activeId) : null
  
  // Add new project to column
  const handleAddToColumn = async (columnKey: string) => {
    const data: Partial<ProjectDatabaseItem> = { name: '' }
    
    if (groupBy === 'status') {
      data.status = columnKey as ProjectStatus
    } else if (groupBy === 'priority') {
      data.priority = columnKey as ProjectPriority
    } else if (groupBy === 'area') {
      data.areaId = columnKey === 'none' ? null : columnKey
    }
    
    await createProject(data)
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {Object.entries(groupedProjects).map(([key, columnProjects]) => {
          const config = getColumnConfig(key)
          
          return (
            <BoardColumn
              key={key}
              id={key}
              title={config.title}
              color={config.color}
              customColor={(config as { customColor?: string }).customColor}
              icon={(config as { icon?: string }).icon}
              projects={columnProjects}
              onCardClick={onCardClick}
              onAddClick={() => handleAddToColumn(key)}
              onDelete={deleteProject}
              areas={areas}
            />
          )
        })}
      </div>
      
      <DragOverlay>
        {activeProject ? (
          <ProjectCard
            project={activeProject}
            areas={areas}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ========================================
// BOARD COLUMN
// ========================================

interface BoardColumnProps {
  id: string
  title: string
  color?: string
  customColor?: string
  icon?: string
  projects: ProjectDatabaseItem[]
  areas: { id: string; name: string; color: string | null }[]
  onCardClick?: (project: ProjectDatabaseItem) => void
  onAddClick: () => void
  onDelete: (id: string) => void
}

function BoardColumn({
  id,
  title,
  color,
  customColor,
  icon,
  projects,
  areas,
  onCardClick,
  onAddClick,
  onDelete,
}: BoardColumnProps) {
  const { setNodeRef } = useSortable({
    id,
    data: { type: 'column' },
  })
  
  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          {customColor && (
            <span 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: customColor }}
            />
          )}
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {projects.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6"
          onClick={onAddClick}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Column Content */}
      <ScrollArea className="flex-1 px-2 py-2">
        <SortableContext
          items={projects.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {projects.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                areas={areas}
                onClick={() => onCardClick?.(project)}
                onDelete={() => onDelete(project.id)}
              />
            ))}
          </div>
        </SortableContext>
        
        {projects.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No projects</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onAddClick}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add project
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ========================================
// SORTABLE PROJECT CARD
// ========================================

interface SortableProjectCardProps {
  project: ProjectDatabaseItem
  areas: { id: string; name: string; color: string | null }[]
  onClick?: () => void
  onDelete?: () => void
}

function SortableProjectCard({ project, areas, onClick, onDelete }: SortableProjectCardProps) {
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
    <div ref={setNodeRef} style={style}>
      <ProjectCard
        project={project}
        areas={areas}
        onClick={onClick}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// ========================================
// PROJECT CARD
// ========================================

interface ProjectCardProps {
  project: ProjectDatabaseItem
  areas: { id: string; name: string; color: string | null }[]
  onClick?: () => void
  onDelete?: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

function ProjectCard({ 
  project, 
  areas, 
  onClick, 
  onDelete, 
  isDragging,
  dragHandleProps,
}: ProjectCardProps) {
  const area = areas.find(a => a.id === project.areaId)
  
  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-all group",
        isDragging && "shadow-lg ring-2 ring-primary/20"
      )}
      onClick={onClick}
    >
      {/* Header with drag handle */}
      <div className="flex items-start gap-2">
        <div 
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab mt-0.5"
          {...dragHandleProps}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            {project.icon && <span className="text-sm">{project.icon}</span>}
            <h4 className="font-medium text-sm truncate">
              {project.name || 'Untitled'}
            </h4>
          </div>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority */}
            <PriorityBadge priority={project.priority} size="sm" />
            
            {/* Area */}
            {area && <AreaBadge area={area} size="sm" />}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            {/* Due date */}
            {project.targetDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {format(new Date(project.targetDate), 'MMM d')}
              </div>
            )}
            
            {/* Progress */}
            {project.progress > 0 && (
              <div className="flex-1 max-w-20 ml-auto">
                <ProgressBar value={project.progress} size="sm" showLabel={false} />
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 -mt-1 -mr-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
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
