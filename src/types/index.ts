/**
 * Comprehensive TypeScript Types for Task Management Application
 * This file defines all the types used across the application
 */

import { Task, Tag, Profile, Habit, FocusSession, Subtask } from '@prisma/client'

// ========================================
// TYPE DEFINITIONS
// ========================================

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Frequency = 'daily' | 'weekly' | 'custom'
export type PermissionLevel = 'view' | 'edit' | 'admin'

// ========================================
// EXTENDED TYPES (with relations)
// ========================================

/**
 * Task with all its relations (tags, etc.)
 */
export type TaskWithRelations = Task & {
  tags?: TaskTagWithTag[]

  reminders?: Reminder[]
  subtasks?: Subtask[]
}

/**
 * Task tag junction with tag data
 */
export type TaskTagWithTag = {
  taskId: string
  tagId: string
  tag: Tag
}



/**
 * Profile with stats and relations
 */
export type ProfileWithStats = Profile & {
  focusSessions?: FocusSession[]
}

/**
 * Habit with completions
 */
export type HabitWithCompletions = Habit & {
  completions?: HabitCompletion[]
}

// ========================================
// FORM INPUT TYPES
// ========================================

/**
 * Input type for creating a new task
 */
export interface CreateTaskInput {
  title: string
  description?: string
  priority?: Priority | null
  dueDate?: string | null // ISO string

  tagIds?: string[]
}

/**
 * Input type for updating a task
 */
export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
  completed?: boolean
  completedAt?: Date | null
}



/**
 * Input type for creating a habit
 */
export interface CreateHabitInput {
  name: string
  frequency: Frequency
}



// ========================================
// AI TYPES
// ========================================

/**
 * Parsed task from AI natural language input
 */
export interface ParsedTask {
  title: string
  description?: string
  priority?: Priority | null
  dueDate?: string // ISO string

}

/**
 * AI-generated task suggestions
 */
export interface TaskSuggestions {
  priority?: Priority | null

  tagIds?: string[]
  estimatedDuration?: number // in minutes
  bestTimeToComplete?: string // ISO string
}

/**
 * AI-generated subtask suggestions
 */
export interface SubtaskSuggestion {
  title: string
  description?: string
  estimatedDuration?: number
}



// ========================================
// FILTER & QUERY TYPES
// ========================================

/**
 * Task filter options
 */
export interface TaskFilters {

  priority?: Priority[]
  tagIds?: string[]
  isCompleted?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  searchQuery?: string
}

/**
 * Smart list type
 */
export type SmartListType =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'no-date'
  | 'completed'
  | 'all'

/**
 * Sort options for tasks
 */
export type TaskSortOption =
  | 'due-date-asc'
  | 'due-date-desc'
  | 'priority-high-first'
  | 'priority-low-first'
  | 'created-asc'
  | 'created-desc'
  | 'alphabetical'
  | 'manual' // sort by sortOrder field

// ========================================
// UI STATE TYPES
// ========================================

/**
 * Command palette command
 */
export interface Command {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  action: () => void | Promise<void>
  shortcut?: string
}

/**
 * Notification type
 */
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  actionUrl?: string
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean
  type?: 'create-task' | 'edit-task' | 'settings' | 'ai-breakdown'
  data?: any
}

// ========================================
// FOCUS MODE TYPES
// ========================================

/**
 * Pomodoro timer mode
 */
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

/**
 * Focus session data
 */
export interface FocusSessionData {
  id: string
  userId: string
  taskId?: string
  startedAt: Date
  endedAt?: Date | null
  durationMinutes?: number
  interruptions: number
}

/**
 * Pomodoro settings
 */
export interface PomodoroSettings {
  focusDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  longBreakInterval: number // after how many pomodoros
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
}

// ========================================
// COLLABORATION TYPES
// ========================================



// ========================================
// ANALYTICS & INSIGHTS TYPES
// ========================================

/**
 * Productivity metrics
 */
export interface ProductivityMetrics {
  tasksCompleted: number
  tasksCreated: number
  completionRate: number // percentage
  avgCompletionTime: number // hours
  streakDays: number
  focusMinutes: number
}

/**
 * Time-based productivity data
 */
export interface ProductivityTrend {
  date: string // ISO date
  tasksCompleted: number
  focusMinutes: number
}



// ========================================
// SETTINGS TYPES
// ========================================

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultView: SmartListType
  defaultTaskPriority: Priority
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  timeFormat: '12h' | '24h'
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'

  // Notifications
  enableNotifications: boolean
  notifyOnTaskDue: boolean
  notifyOnTaskAssigned: boolean
  emailDigest: 'daily' | 'weekly' | 'never'

  // Focus
  pomodoroSettings: PomodoroSettings

  // AI
  enableAISuggestions: boolean
  autoParseNaturalLanguage: boolean
}

// ========================================
// API RESPONSE TYPES
// ========================================

/**
 * Standard API success response
 */
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

/**
 * Standard API error response
 */
export interface ErrorResponse {
  success: false
  error: string
  details?: any
}

/**
 * API response type (union)
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Date range
 */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ========================================
// TYPE GUARDS
// ========================================

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true
}

/**
 * Check if response is error
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false
}

// ========================================
// CONSTANTS
// ========================================

/**
 * Priority levels for display
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

/**
 * Priority colors
 */
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'blue',
  medium: 'yellow',
  high: 'orange',
  urgent: 'red',
}



// ========================================
// RE-EXPORTS FROM PRISMA
// ========================================

export type {
  Task,
  Subtask,
} from '@prisma/client'

// Section is imported at the top and used in types


// Additional types that might be missing
export interface Reminder {
  id: string
  taskId: string
  remindAt: Date
  isSent: boolean
  createdAt: Date
}

export interface HabitCompletion {
  id: string
  habitId: string
  completedAt: Date
}


