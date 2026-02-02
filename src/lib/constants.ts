/**
 * Application-wide constants and configuration
 */

// ========================================
// APP CONFIGURATION
// ========================================

export const APP_NAME = 'Mentra'
export const APP_DESCRIPTION = 'Premium Task & Life Management'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ========================================
// ROUTES
// ========================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  INBOX: '/inbox',
  TODAY: '/today',
  UPCOMING: '/upcoming',
  TASKS: '/tasks',
  HABITS: '/habits',
  FOCUS: '/focus',
} as const

export const AUTH_ROUTES = ['/login', '/signup']
export const PROTECTED_ROUTES = ['/inbox', '/today', '/upcoming', '/tasks', '/habits', '/focus']

// ========================================
// GAMIFICATION CONSTANTS
// ========================================

export const XP_VALUES = {
  TASK_COMPLETE: 10,
  SUBTASK_COMPLETE: 5,
  HIGH_PRIORITY_TASK: 15,
  ON_TIME_COMPLETION: 5, // Bonus
  STREAK_BONUS: 25,
  HABIT_COMPLETE: 8,
  FOCUS_SESSION: 20,
  WEEKLY_GOAL: 50,
} as const

export const LEVEL_CONFIG = {
  BASE_XP: 100,
  MULTIPLIER: 1.5,
  MAX_LEVEL: 50,
} as const

// ========================================
// POMODORO SETTINGS
// ========================================

export const POMODORO_DEFAULTS = {
  FOCUS_DURATION: 25, // minutes
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
  LONG_BREAK_INTERVAL: 4, // after how many pomodoros
} as const

// ========================================
// TASK SETTINGS
// ========================================

export const TASK_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  MAX_SUBTASKS: 50,
  MAX_TAGS: 10,
} as const

export const PRIORITY_ORDER = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  NONE: 3,
} as const





// ========================================
// KEYBOARD SHORTCUTS
// ========================================

export const KEYBOARD_SHORTCUTS = {
  COMMAND_PALETTE: { key: 'k', meta: true },
  NEW_TASK: { key: 'n', meta: true },
  SEARCH: { key: 'f', meta: true },
  TOGGLE_SIDEBAR: { key: 'b', meta: true },
  FOCUS_MODE: { key: 'f', meta: true, shift: true },
  COMPLETE_TASK: { key: 'Enter', meta: true },
  DELETE_TASK: { key: 'Backspace', meta: true },
} as const

// ========================================
// NOTIFICATION SETTINGS
// ========================================

export const NOTIFICATION_TYPES = {
  TASK_REMINDER: 'task_reminder',
  FOCUS_COMPLETE: 'focus_complete',
  STREAK_MILESTONE: 'streak_milestone',
  LEVEL_UP: 'level_up',
  ACHIEVEMENT: 'achievement',
} as const

// ========================================
// RECURRENCE PATTERNS
// ========================================

export const RECURRENCE_OPTIONS = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom', value: 'CUSTOM' },
] as const

// ========================================
// DATE/TIME FORMATS
// ========================================

export const DATE_FORMATS = {
  SHORT: 'MMM d',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  TIME_ONLY: 'h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const

// ========================================
// STORAGE KEYS
// ========================================

export const STORAGE_KEYS = {
  THEME: 'taskflow-theme',
  SIDEBAR_STATE: 'taskflow-sidebar',
  VIEW_MODE: 'taskflow-view-mode',
  LAST_VISITED: 'taskflow-last-visited',
  POMODORO_SETTINGS: 'taskflow-pomodoro',
  ONBOARDING_COMPLETED: 'taskflow-onboarding',
} as const

// ========================================
// API ENDPOINTS
// ========================================

export const API_ENDPOINTS = {
  TASKS: '/api/tasks',
  TAGS: '/api/tags',
  HABITS: '/api/habits',
  PROFILE: '/api/profile',
  AI: '/api/ai',
} as const

// ========================================
// FEATURE FLAGS
// ========================================

export const FEATURES = {
  AI_SUGGESTIONS: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES !== 'false',
  COLLABORATION: process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === 'true',
  HABITS: process.env.NEXT_PUBLIC_ENABLE_HABITS !== 'false',
  ANALYTICS: process.env.NODE_ENV === 'production',
  OFFLINE_MODE: true,
} as const

// ========================================
// ERROR MESSAGES
// ========================================

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please sign in to continue.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Our team has been notified.',
} as const

// ========================================
// SUCCESS MESSAGES
// ========================================

export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated',
  TASK_DELETED: 'Task deleted',
  TASK_COMPLETED: 'Task completed! 🎉',
  PROFILE_UPDATED: 'Profile updated',
  SETTINGS_SAVED: 'Settings saved',
} as const

// ========================================
// LIMITS & QUOTAS (Free Tier)
// ========================================

export const FREE_TIER_LIMITS = {
  MAX_TASKS: -1, // unlimited
  MAX_HABITS: 5,
  MAX_TAGS: 10,
  MAX_ATTACHMENTS_SIZE: 10 * 1024 * 1024, // 10MB
  AI_REQUESTS_PER_DAY: 50,
} as const

// ========================================
// PREMIUM TIER LIMITS
// ========================================

export const PREMIUM_TIER_LIMITS = {
  MAX_TASKS: -1, // unlimited
  MAX_HABITS: -1, // unlimited
  MAX_TAGS: -1, // unlimited
  MAX_ATTACHMENTS_SIZE: 100 * 1024 * 1024, // 100MB
  AI_REQUESTS_PER_DAY: -1, // unlimited
} as const

// ========================================
// VALIDATION PATTERNS
// ========================================

export const VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
  TASK_TITLE_MIN: 1,
  TASK_TITLE_MAX: 200,
  PASSWORD_MIN: 8,
} as const
