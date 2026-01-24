'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectDatabase } from './project-database-context'
import { InlineEditCell } from './inline-edit-cell'
import { StatusBadge, PriorityBadge, AreaBadge, ProgressBar, DateDisplay } from './cell-renderers'
import {
  ProjectDatabaseItem,
  ColumnDefinition,
  DEFAULT_COLUMNS,
  TableViewProps,
} from './types'

// ========================================
// TABLE VIEW COMPONENT
// ========================================

export function TableView({ onRowClick }: TableViewProps) {
  const {
    projects,
    viewState,
    selectedProjectIds,
    editingCell,
    areas,
    selectAll,
    clearSelection,
    toggleProjectSelection,
    startEditing,
    stopEditing,
    updateProject,
    deleteProject,
    createProject,
    setSorts,
  } = useProjectDatabase()

  const tableRef = useRef<HTMLDivElement>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Get visible columns in order
  const visibleColumns = viewState.columnOrder
    .map(id => DEFAULT_COLUMNS.find(c => c.id === id))
    .filter((c): c is ColumnDefinition => c !== undefined && viewState.visibleColumns.includes(c.id))

  // Handle column sort
  const handleSort = useCallback((columnId: string) => {
    const currentSort = viewState.sorts.find(s => s.field === columnId)
    if (currentSort) {
      if (currentSort.direction === 'asc') {
        setSorts([{ field: columnId, direction: 'desc' }])
      } else {
        setSorts([])
      }
    } else {
      setSorts([{ field: columnId, direction: 'asc' }])
    }
  }, [viewState.sorts, setSorts])

  // Check if all are selected
  const allSelected = projects.length > 0 && selectedProjectIds.size === projects.length
  const someSelected = selectedProjectIds.size > 0 && selectedProjectIds.size < projects.length

  // Handle select all toggle
  const handleSelectAllToggle = useCallback(() => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [allSelected, clearSelection, selectAll])

  // Handle row click
  const handleRowClick = useCallback((e: React.MouseEvent, project: ProjectDatabaseItem) => {
    // Don't trigger row click if clicking on checkbox, dropdown, or editing cell
    if ((e.target as HTMLElement).closest('[data-no-row-click]')) return
    onRowClick?.(project)
  }, [onRowClick])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) {
        if (e.key === 'Escape') {
          stopEditing()
        }
        return
      }

      // Add more keyboard navigation as needed
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingCell, stopEditing])

  // Add new project row
  const handleAddProject = useCallback(async () => {
    await createProject({ name: '' })
  }, [createProject])

  return (
    <div ref={tableRef} className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead className="sticky top-0 z-10 bg-muted/30">
          <tr className="border-b border-border/40">
            {/* Checkbox column */}
            <th className="w-10 px-2 py-2 text-left">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={handleSelectAllToggle}
                data-no-row-click
                aria-label="Select all"
              />
            </th>

            {/* Data columns */}
            {visibleColumns.map((column) => {
              const sort = viewState.sorts.find(s => s.field === column.id)

              return (
                <th
                  key={column.id}
                  style={{ width: column.width, minWidth: column.minWidth }}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide",
                    column.sortable && "cursor-pointer hover:text-foreground transition-colors",
                    column.sticky && "sticky left-10 bg-background z-20"
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.name}</span>
                    {column.sortable && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        {sort?.direction === 'asc' && <ChevronUp className="w-3 h-3" />}
                        {sort?.direction === 'desc' && <ChevronDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
              )
            })}

            {/* Actions column */}
            <th className="w-10 px-2 py-2" />
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {projects.map((project) => {
            const isSelected = selectedProjectIds.has(project.id)
            const isHovered = hoveredRow === project.id

            return (
              <tr
                key={project.id}
                className={cn(
                  "border-b border-border/30 transition-colors group",
                  isSelected && "bg-primary/5",
                  isHovered && !isSelected && "bg-accent/30",
                  "cursor-pointer hover:bg-accent/40"
                )}
                onMouseEnter={() => setHoveredRow(project.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={(e) => handleRowClick(e, project)}
              >
                {/* Checkbox */}
                <td className="px-2 py-2" data-no-row-click>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity cursor-grab",
                      isSelected && "opacity-100"
                    )}>
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                    </span>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProjectSelection(project.id)}
                      aria-label={`Select ${project.name}`}
                    />
                  </div>
                </td>

                {/* Data cells */}
                {visibleColumns.map((column) => {
                  const isEditing = editingCell?.projectId === project.id && editingCell?.columnId === column.id

                  return (
                    <td
                      key={column.id}
                      style={{ width: column.width, minWidth: column.minWidth }}
                      className={cn(
                        "px-3 py-2",
                        column.sticky && "sticky left-10 bg-background z-10",
                        column.editable && "cursor-text"
                      )}
                      onClick={(e) => {
                        if (column.editable && !isEditing) {
                          e.stopPropagation()
                          startEditing(project.id, column.id)
                        }
                      }}
                      data-no-row-click={column.editable}
                    >
                      {isEditing ? (
                        <InlineEditCell
                          project={project}
                          column={column}
                          areas={areas}
                          onSave={(value: unknown) => {
                            updateProject(project.id, { [column.id]: value })
                            stopEditing()
                          }}
                          onCancel={stopEditing}
                        />
                      ) : (
                        <CellRenderer project={project} column={column} areas={areas} />
                      )}
                    </td>
                  )
                })}

                {/* Actions */}
                <td className="px-2 py-2" data-no-row-click>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7",
                          isSelected && "opacity-100"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onRowClick?.(project)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}

          {/* Add new row */}
          <tr className="hover:bg-accent/20 transition-colors">
            <td colSpan={visibleColumns.length + 2} className="px-3 py-2.5">
              <button
                onClick={handleAddProject}
                className="flex items-center gap-2 text-primary/70 hover:text-primary transition-colors w-full text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New project</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first project to get started
          </p>
          <Button onClick={handleAddProject}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      )}
    </div>
  )
}

// ========================================
// CELL RENDERER
// ========================================

interface CellRendererProps {
  project: ProjectDatabaseItem
  column: ColumnDefinition
  areas: { id: string; name: string; color: string | null }[]
}

function CellRenderer({ project, column, areas }: CellRendererProps) {
  switch (column.type) {
    case 'title':
      return (
        <div className="flex items-center gap-2">
          {project.icon && <span>{project.icon}</span>}
          <span className="font-medium truncate">{project.name || 'Untitled'}</span>
        </div>
      )

    case 'status':
      return <StatusBadge status={project.status} />

    case 'priority':
      return <PriorityBadge priority={project.priority} />

    case 'area':
      const area = areas.find(a => a.id === project.areaId)
      return area ? <AreaBadge area={area} /> : <span className="text-muted-foreground text-sm">—</span>

    case 'date':
      const dateValue = project[column.id as keyof ProjectDatabaseItem] as Date | null
      return <DateDisplay date={dateValue} />

    case 'progress':
      return <ProgressBar value={project.progress} />

    case 'text':
      return <span className="text-sm truncate">{String(project[column.id as keyof ProjectDatabaseItem] || '')}</span>

    default:
      return <span className="text-sm text-muted-foreground">—</span>
  }
}
