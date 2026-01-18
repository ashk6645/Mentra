'use client'

import React, { createContext, useContext, useCallback, useMemo, useOptimistic, useTransition } from 'react'
import { AreaOfLife } from '@prisma/client'
import {
  ProjectDatabaseItem,
  ProjectDatabaseState,
  ProjectDatabaseActions,
  ProjectDatabaseContextValue,
  ViewState,
  Filter,
  Sort,
  DatabaseView,
  DEFAULT_VIEW_STATE,
  ProjectStatus,
  ProjectPriority,
} from './types'

// ========================================
// CONTEXT
// ========================================

const ProjectDatabaseContext = createContext<ProjectDatabaseContextValue | null>(null)

// ========================================
// HOOK
// ========================================

export function useProjectDatabase() {
  const context = useContext(ProjectDatabaseContext)
  if (!context) {
    throw new Error('useProjectDatabase must be used within a ProjectDatabaseProvider')
  }
  return context
}

// ========================================
// FILTER & SORT HELPERS
// ========================================

function applyFilters(projects: ProjectDatabaseItem[], filters: Filter[]): ProjectDatabaseItem[] {
  if (filters.length === 0) return projects
  
  return projects.filter(project => {
    return filters.every(filter => {
      const value = project[filter.field as keyof ProjectDatabaseItem]
      
      switch (filter.operator) {
        case 'is':
          return value === filter.value
        case 'is_not':
          return value !== filter.value
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
        case 'does_not_contain':
          return !String(value).toLowerCase().includes(String(filter.value).toLowerCase())
        case 'is_empty':
          return value === null || value === '' || value === undefined
        case 'is_not_empty':
          return value !== null && value !== '' && value !== undefined
        case 'before':
          return value instanceof Date && filter.value && value < new Date(filter.value as string)
        case 'after':
          return value instanceof Date && filter.value && value > new Date(filter.value as string)
        case 'on_or_before':
          return value instanceof Date && filter.value && value <= new Date(filter.value as string)
        case 'on_or_after':
          return value instanceof Date && filter.value && value >= new Date(filter.value as string)
        default:
          return true
      }
    })
  })
}

function applySorts(projects: ProjectDatabaseItem[], sorts: Sort[]): ProjectDatabaseItem[] {
  if (sorts.length === 0) return projects
  
  return [...projects].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field as keyof ProjectDatabaseItem]
      const bVal = b[sort.field as keyof ProjectDatabaseItem]
      
      let comparison = 0
      
      if (aVal === null || aVal === undefined) comparison = 1
      else if (bVal === null || bVal === undefined) comparison = -1
      else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })
}

// ========================================
// PROVIDER PROPS
// ========================================

interface ProjectDatabaseProviderProps {
  children: React.ReactNode
  initialProjects?: ProjectDatabaseItem[]
  initialAreas?: AreaOfLife[]
  initialViewState?: Partial<ViewState>
  onProjectCreate?: (project: ProjectDatabaseItem) => Promise<ProjectDatabaseItem | null>
  onProjectUpdate?: (id: string, data: Partial<ProjectDatabaseItem>) => Promise<ProjectDatabaseItem | null>
  onProjectDelete?: (id: string) => Promise<boolean>
  onRefresh?: () => Promise<ProjectDatabaseItem[]>
}

// ========================================
// PROVIDER
// ========================================

export function ProjectDatabaseProvider({
  children,
  initialProjects = [],
  initialAreas = [],
  initialViewState,
  onProjectCreate,
  onProjectUpdate,
  onProjectDelete,
  onRefresh,
}: ProjectDatabaseProviderProps) {
  const [isPending, startTransition] = useTransition()
  
  // State
  const [projects, setProjects] = React.useState<ProjectDatabaseItem[]>(initialProjects)
  const [areas] = React.useState<AreaOfLife[]>(initialAreas)
  const [error, setError] = React.useState<string | null>(null)
  const [viewState, setViewState] = React.useState<ViewState>({
    ...DEFAULT_VIEW_STATE,
    ...initialViewState,
  })
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = React.useState<{ projectId: string; columnId: string } | null>(null)
  
  // Optimistic updates
  const [optimisticProjects, addOptimisticUpdate] = useOptimistic(
    projects,
    (state, action: { type: 'add' | 'update' | 'delete'; data: ProjectDatabaseItem | string }) => {
      switch (action.type) {
        case 'add':
          return [...state, action.data as ProjectDatabaseItem]
        case 'update':
          return state.map(p => p.id === (action.data as ProjectDatabaseItem).id ? action.data as ProjectDatabaseItem : p)
        case 'delete':
          return state.filter(p => p.id !== action.data)
        default:
          return state
      }
    }
  )
  
  // CRUD Actions
  const createProject = useCallback(async (data: Partial<ProjectDatabaseItem>): Promise<ProjectDatabaseItem | null> => {
    const tempProject: ProjectDatabaseItem = {
      id: `temp-${Date.now()}`,
      userId: '',
      name: data.name || 'New Project',
      description: data.description || null,
      status: data.status || 'ACTIVE',
      priority: data.priority || 'MEDIUM',
      areaId: data.areaId || null,
      startDate: data.startDate || null,
      targetDate: data.targetDate || null,
      progress: 0,
      color: data.color || null,
      icon: data.icon || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    startTransition(() => {
      addOptimisticUpdate({ type: 'add', data: tempProject })
    })
    
    if (onProjectCreate) {
      const result = await onProjectCreate(tempProject)
      if (result) {
        setProjects(prev => prev.filter(p => p.id !== tempProject.id).concat(result))
        return result
      }
    }
    
    return null
  }, [onProjectCreate, addOptimisticUpdate])
  
  const updateProject = useCallback(async (id: string, data: Partial<ProjectDatabaseItem>): Promise<ProjectDatabaseItem | null> => {
    const project = projects.find(p => p.id === id)
    if (!project) return null
    
    const updatedProject = { ...project, ...data, updatedAt: new Date() }
    
    startTransition(() => {
      addOptimisticUpdate({ type: 'update', data: updatedProject })
    })
    
    if (onProjectUpdate) {
      const result = await onProjectUpdate(id, data)
      if (result) {
        setProjects(prev => prev.map(p => p.id === id ? result : p))
        return result
      }
    }
    
    return updatedProject
  }, [projects, onProjectUpdate, addOptimisticUpdate])
  
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    startTransition(() => {
      addOptimisticUpdate({ type: 'delete', data: id })
    })
    
    if (onProjectDelete) {
      const success = await onProjectDelete(id)
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== id))
        setSelectedProjectIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        return true
      }
    }
    
    return false
  }, [onProjectDelete, addOptimisticUpdate])
  
  const deleteProjects = useCallback(async (ids: string[]): Promise<boolean> => {
    const results = await Promise.all(ids.map(id => deleteProject(id)))
    return results.every(r => r)
  }, [deleteProject])
  
  // View Actions
  const setView = useCallback((view: DatabaseView) => {
    setViewState(prev => ({ ...prev, view }))
  }, [])
  
  const setFilters = useCallback((filters: Filter[]) => {
    setViewState(prev => ({ ...prev, filters }))
  }, [])
  
  const addFilter = useCallback((filter: Filter) => {
    setViewState(prev => ({ ...prev, filters: [...prev.filters, filter] }))
  }, [])
  
  const removeFilter = useCallback((filterId: string) => {
    setViewState(prev => ({ ...prev, filters: prev.filters.filter(f => f.id !== filterId) }))
  }, [])
  
  const setSorts = useCallback((sorts: Sort[]) => {
    setViewState(prev => ({ ...prev, sorts }))
  }, [])
  
  const toggleColumn = useCallback((columnId: string) => {
    setViewState(prev => ({
      ...prev,
      visibleColumns: prev.visibleColumns.includes(columnId)
        ? prev.visibleColumns.filter(c => c !== columnId)
        : [...prev.visibleColumns, columnId],
    }))
  }, [])
  
  const reorderColumns = useCallback((columnOrder: string[]) => {
    setViewState(prev => ({ ...prev, columnOrder }))
  }, [])
  
  // Selection Actions
  const selectProject = useCallback((id: string) => {
    setSelectedProjectIds(prev => new Set(prev).add(id))
  }, [])
  
  const deselectProject = useCallback((id: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])
  
  const toggleProjectSelection = useCallback((id: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])
  
  const selectAll = useCallback(() => {
    setSelectedProjectIds(new Set(optimisticProjects.map(p => p.id)))
  }, [optimisticProjects])
  
  const clearSelection = useCallback(() => {
    setSelectedProjectIds(new Set())
  }, [])
  
  // Editing Actions
  const startEditing = useCallback((projectId: string, columnId: string) => {
    setEditingCell({ projectId, columnId })
  }, [])
  
  const stopEditing = useCallback(() => {
    setEditingCell(null)
  }, [])
  
  // Refresh
  const refreshProjects = useCallback(async () => {
    if (onRefresh) {
      setError(null)
      try {
        const freshProjects = await onRefresh()
        setProjects(freshProjects)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to refresh projects')
      }
    }
  }, [onRefresh])
  
  // Computed projects with filters and sorts
  const filteredAndSortedProjects = useMemo(() => {
    let result = optimisticProjects
    result = applyFilters(result, viewState.filters)
    result = applySorts(result, viewState.sorts)
    return result
  }, [optimisticProjects, viewState.filters, viewState.sorts])
  
  // Context value
  const value: ProjectDatabaseContextValue = useMemo(() => ({
    // State
    projects: filteredAndSortedProjects,
    isLoading: isPending,
    error,
    viewState,
    selectedProjectIds,
    editingCell,
    areas,
    
    // Actions
    createProject,
    updateProject,
    deleteProject,
    deleteProjects,
    setView,
    setFilters,
    addFilter,
    removeFilter,
    setSorts,
    toggleColumn,
    reorderColumns,
    selectProject,
    deselectProject,
    toggleProjectSelection,
    selectAll,
    clearSelection,
    startEditing,
    stopEditing,
    refreshProjects,
  }), [
    filteredAndSortedProjects,
    isPending,
    error,
    viewState,
    selectedProjectIds,
    editingCell,
    areas,
    createProject,
    updateProject,
    deleteProject,
    deleteProjects,
    setView,
    setFilters,
    addFilter,
    removeFilter,
    setSorts,
    toggleColumn,
    reorderColumns,
    selectProject,
    deselectProject,
    toggleProjectSelection,
    selectAll,
    clearSelection,
    startEditing,
    stopEditing,
    refreshProjects,
  ])
  
  return (
    <ProjectDatabaseContext.Provider value={value}>
      {children}
    </ProjectDatabaseContext.Provider>
  )
}
