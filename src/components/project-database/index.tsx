'use client'

import React, { useState } from 'react'
import { AreaOfLife } from '@prisma/client'
import { cn } from '@/lib/utils'
import { ProjectDatabaseProvider, useProjectDatabase } from './project-database-context'
import { TableView } from './table-view'
import { BoardView } from './board-view'
import { GalleryView } from './gallery-view'
import { TimelineView } from './timeline-view'
import { CalendarView } from './calendar-view'
import { ViewSwitcher } from './view-switcher'
import { FilterBar } from './filter-bar'
import { PropertiesPanel } from './properties-panel'
import { ProjectDetailsSheet } from './project-details-sheet'
import {
  createProject,
  updateProject,
  deleteProject,
  bulkDeleteProjects,
} from '@/lib/actions/project-database-actions'
import {
  ProjectDatabaseItem,
  ProjectDatabaseProps,
  DatabaseView,
} from './types'

// ========================================
// PROJECT DATABASE (MAIN COMPONENT)
// ========================================

export function ProjectDatabase({
  initialProjects = [],
  initialAreas = [],
  initialViewState,
  onProjectClick,
  className,
}: ProjectDatabaseProps) {
  // Server actions wrapped for context
  const handleCreate = async (project: ProjectDatabaseItem) => {
    const result = await createProject({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      areaId: project.areaId,
      startDate: project.startDate,
      targetDate: project.targetDate,
      color: project.color,
      icon: project.icon,
    })

    return result.project || null
  }

  const handleUpdate = async (id: string, data: Partial<ProjectDatabaseItem>) => {
    const result = await updateProject(id, data)
    return result.project || null
  }

  const handleDelete = async (id: string) => {
    const result = await deleteProject(id)
    return result.success || false
  }

  return (
    <ProjectDatabaseProvider
      initialProjects={initialProjects}
      initialAreas={initialAreas}
      initialViewState={initialViewState}
      onProjectCreate={handleCreate}
      onProjectUpdate={handleUpdate}
      onProjectDelete={handleDelete}
    >
      <ProjectDatabaseContent
        onProjectClick={onProjectClick}
        className={className}
      />
    </ProjectDatabaseProvider>
  )
}

// ========================================
// PROJECT DATABASE CONTENT
// ========================================

interface ProjectDatabaseContentProps {
  onProjectClick?: (project: ProjectDatabaseItem) => void
  className?: string
}

function ProjectDatabaseContent({ onProjectClick, className }: ProjectDatabaseContentProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectDatabaseItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleProjectClick = (project: ProjectDatabaseItem) => {
    setSelectedProject(project)
    setIsDetailsOpen(true)
    onProjectClick?.(project)
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Toolbar */}
      <DatabaseToolbar />

      {/* View Container */}
      <DatabaseViewContainer onProjectClick={handleProjectClick} />

      {/* Project Details Sheet */}
      <ProjectDetailsSheet
        project={selectedProject}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}

// ========================================
// DATABASE TOOLBAR
// ========================================

function DatabaseToolbar() {
  const [showProperties, setShowProperties] = useState(false)

  return (
    <div className="border-b border-border/30 bg-muted/20">
      <div className="flex items-center justify-between px-6 py-2">
        {/* Left: View Switcher */}
        <ViewSwitcher />

        {/* Right: Filter Bar & Properties */}
        <div className="flex items-center gap-2">
          <FilterBar />
          <PropertiesPanel
            open={showProperties}
            onOpenChange={setShowProperties}
          />
        </div>
      </div>
    </div>
  )
}

// ========================================
// VIEW CONTAINER
// ========================================

interface DatabaseViewContainerProps {
  onProjectClick: (project: ProjectDatabaseItem) => void
}

function DatabaseViewContainer({ onProjectClick }: DatabaseViewContainerProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <DatabaseViewRenderer onProjectClick={onProjectClick} />
    </div>
  )
}

// ========================================
// VIEW RENDERER
// ========================================

interface DatabaseViewRendererProps {
  onProjectClick: (project: ProjectDatabaseItem) => void
}

function DatabaseViewRenderer({ onProjectClick }: DatabaseViewRendererProps) {
  const { viewState } = useProjectDatabase()

  switch (viewState.view) {
    case 'table':
      return <TableView onRowClick={onProjectClick} />

    case 'board':
      return <BoardView onCardClick={onProjectClick} groupBy="status" />

    case 'gallery':
      return <GalleryView onProjectClick={onProjectClick} />

    case 'timeline':
      return <TimelineView onProjectClick={onProjectClick} zoom="month" />

    case 'calendar':
      return (
        <CalendarView
          onProjectClick={onProjectClick}
          onDateClick={(date) => {
            // Handle date click - could open create dialog with pre-filled date
            console.log('Date clicked:', date)
          }}
        />
      )

    default:
      return <TableView onRowClick={onProjectClick} />
  }
}

// ========================================
// EXPORT TYPES
// ========================================

export type { ProjectDatabaseItem, ProjectDatabaseProps }
export { ProjectDatabaseProvider, useProjectDatabase } from './project-database-context'
