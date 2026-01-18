/**
 * Notion-Style Project Database Types
 * 
 * Core type definitions for the project database system
 */

import { Project, Task, AreaOfLife } from '@prisma/client'

// ========================================
// STATUS & PRIORITY ENUMS
// ========================================

export const PROJECT_STATUSES = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
} as const

export type ProjectStatus = keyof typeof PROJECT_STATUSES

export const PROJECT_PRIORITIES = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const

export type ProjectPriority = keyof typeof PROJECT_PRIORITIES

// ========================================
// STATUS & PRIORITY DISPLAY CONFIG
// ========================================

export const STATUS_CONFIG: Record<ProjectStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  PLANNING: {
    label: 'Planning',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  ACTIVE: {
    label: 'Active',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  ON_HOLD: {
    label: 'On Hold',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
  },
}

export const PRIORITY_CONFIG: Record<ProjectPriority, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  HIGH: {
    label: 'High',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🔴',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: '🟡',
  },
  LOW: {
    label: 'Low',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800/30',
    icon: '⚪',
  },
}

// ========================================
// VIEW TYPES
// ========================================

export const DATABASE_VIEWS = {
  TABLE: 'table',
  BOARD: 'board',
  TIMELINE: 'timeline',
  CALENDAR: 'calendar',
} as const

export type DatabaseView = typeof DATABASE_VIEWS[keyof typeof DATABASE_VIEWS]

// ========================================
// COLUMN DEFINITIONS
// ========================================

export type ColumnType = 
  | 'title' 
  | 'status' 
  | 'priority' 
  | 'area' 
  | 'date' 
  | 'progress' 
  | 'text'
  | 'number'

export interface ColumnDefinition {
  id: string
  name: string
  type: ColumnType
  width?: number
  minWidth?: number
  visible: boolean
  sortable: boolean
  filterable: boolean
  editable: boolean
  sticky?: boolean
}

export const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', name: 'Name', type: 'title', width: 280, minWidth: 200, visible: true, sortable: true, filterable: true, editable: true, sticky: true },
  { id: 'status', name: 'Status', type: 'status', width: 130, minWidth: 100, visible: true, sortable: true, filterable: true, editable: true },
  { id: 'priority', name: 'Priority', type: 'priority', width: 110, minWidth: 90, visible: true, sortable: true, filterable: true, editable: true },
  { id: 'area', name: 'Area', type: 'area', width: 140, minWidth: 100, visible: true, sortable: true, filterable: true, editable: true },
  { id: 'startDate', name: 'Start Date', type: 'date', width: 130, minWidth: 110, visible: true, sortable: true, filterable: true, editable: true },
  { id: 'targetDate', name: 'Target Date', type: 'date', width: 130, minWidth: 110, visible: true, sortable: true, filterable: true, editable: true },
  { id: 'progress', name: 'Progress', type: 'progress', width: 120, minWidth: 100, visible: true, sortable: true, filterable: false, editable: false },
  { id: 'createdAt', name: 'Created', type: 'date', width: 130, minWidth: 110, visible: false, sortable: true, filterable: true, editable: false },
]

// ========================================
// FILTER & SORT TYPES
// ========================================

export type FilterOperator = 
  | 'is' 
  | 'is_not' 
  | 'contains' 
  | 'does_not_contain' 
  | 'is_empty' 
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'on_or_before'
  | 'on_or_after'

export interface Filter {
  id: string
  field: string
  operator: FilterOperator
  value: string | string[] | null
}

export type SortDirection = 'asc' | 'desc'

export interface Sort {
  field: string
  direction: SortDirection
}

// ========================================
// PROJECT DATABASE ITEM
// ========================================

export interface ProjectDatabaseItem {
  id: string
  userId: string
  name: string
  description: string | null
  status: ProjectStatus
  priority: ProjectPriority
  areaId: string | null
  startDate: Date | null
  targetDate: Date | null
  progress: number // 0-100, calculated from tasks
  color: string | null
  icon: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  area?: AreaOfLife | null
  tasks?: Task[]
  taskCount?: number
  completedTaskCount?: number
}

// ========================================
// VIEW STATE
// ========================================

export interface ViewState {
  id: string
  name: string
  view: DatabaseView
  filters: Filter[]
  sorts: Sort[]
  visibleColumns: string[]
  columnOrder: string[]
  groupBy?: string
}

export const DEFAULT_VIEW_STATE: ViewState = {
  id: 'default',
  name: 'All Projects',
  view: 'table',
  filters: [],
  sorts: [{ field: 'updatedAt', direction: 'desc' }],
  visibleColumns: ['name', 'status', 'priority', 'area', 'targetDate', 'progress'],
  columnOrder: ['name', 'status', 'priority', 'area', 'startDate', 'targetDate', 'progress', 'createdAt'],
}

// ========================================
// DATABASE CONTEXT & STATE
// ========================================

export interface ProjectDatabaseState {
  projects: ProjectDatabaseItem[]
  isLoading: boolean
  error: string | null
  viewState: ViewState
  selectedProjectIds: Set<string>
  editingCell: { projectId: string; columnId: string } | null
  areas: AreaOfLife[]
}

export interface ProjectDatabaseActions {
  // CRUD
  createProject: (data: Partial<ProjectDatabaseItem>) => Promise<ProjectDatabaseItem | null>
  updateProject: (id: string, data: Partial<ProjectDatabaseItem>) => Promise<ProjectDatabaseItem | null>
  deleteProject: (id: string) => Promise<boolean>
  deleteProjects: (ids: string[]) => Promise<boolean>
  
  // View
  setView: (view: DatabaseView) => void
  setFilters: (filters: Filter[]) => void
  addFilter: (filter: Filter) => void
  removeFilter: (filterId: string) => void
  setSorts: (sorts: Sort[]) => void
  toggleColumn: (columnId: string) => void
  reorderColumns: (columnOrder: string[]) => void
  
  // Selection
  selectProject: (id: string) => void
  deselectProject: (id: string) => void
  toggleProjectSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  
  // Editing
  startEditing: (projectId: string, columnId: string) => void
  stopEditing: () => void
  
  // Refresh
  refreshProjects: () => Promise<void>
}

export type ProjectDatabaseContextValue = ProjectDatabaseState & ProjectDatabaseActions

// ========================================
// COMPONENT PROPS
// ========================================

export interface ProjectDatabaseProps {
  initialProjects?: ProjectDatabaseItem[]
  initialAreas?: AreaOfLife[]
  initialViewState?: Partial<ViewState>
  onProjectClick?: (project: ProjectDatabaseItem) => void
  onProjectCreate?: (project: ProjectDatabaseItem) => void
  onProjectUpdate?: (project: ProjectDatabaseItem) => void
  onProjectDelete?: (projectId: string) => void
  className?: string
}

export interface TableViewProps {
  onRowClick?: (project: ProjectDatabaseItem) => void
}

export interface BoardViewProps {
  groupBy?: 'status' | 'priority' | 'area'
  onCardClick?: (project: ProjectDatabaseItem) => void
}

export interface TimelineViewProps {
  startDate?: Date
  endDate?: Date
  zoom?: 'day' | 'week' | 'month'
  onProjectClick?: (project: ProjectDatabaseItem) => void
}

export interface CalendarViewProps {
  initialDate?: Date
  onProjectClick?: (project: ProjectDatabaseItem) => void
  onDateClick?: (date: Date) => void
}
