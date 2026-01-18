'use client'

import React from 'react'
import { format } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  ProjectStatus,
  ProjectPriority,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from './types'

// ========================================
// STATUS BADGE
// ========================================

interface StatusBadgeProps {
  status: ProjectStatus
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function StatusBadge({ status, size = 'sm', showIcon = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        config.bgColor,
        config.color,
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {showIcon && (
        <span className={cn(
          "rounded-full",
          size === 'sm' ? "w-1.5 h-1.5" : "w-2 h-2",
          status === 'PLANNING' && "bg-purple-500",
          status === 'ACTIVE' && "bg-blue-500",
          status === 'ON_HOLD' && "bg-amber-500",
          status === 'COMPLETED' && "bg-emerald-500"
        )} />
      )}
      {config.label}
    </span>
  )
}

// ========================================
// PRIORITY BADGE
// ========================================

interface PriorityBadgeProps {
  priority: ProjectPriority
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function PriorityBadge({ priority, size = 'sm', showIcon = true }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium",
        config.bgColor,
        config.color,
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {showIcon && <span className="text-[10px]">{config.icon}</span>}
      {config.label}
    </span>
  )
}

// ========================================
// AREA BADGE
// ========================================

interface AreaBadgeProps {
  area: { name: string; color: string | null }
  size?: 'sm' | 'md'
}

export function AreaBadge({ area, size = 'sm' }: AreaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium bg-secondary text-secondary-foreground",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {area.color && (
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: area.color }}
        />
      )}
      {area.name}
    </span>
  )
}

// ========================================
// PROGRESS BAR
// ========================================

interface ProgressBarProps {
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, showLabel = true, size = 'sm' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value))
  
  return (
    <div className="flex items-center gap-2">
      <Progress 
        value={percentage} 
        className={cn(
          "flex-1",
          size === 'sm' ? "h-1.5" : "h-2"
        )}
      />
      {showLabel && (
        <span className={cn(
          "text-muted-foreground tabular-nums",
          size === 'sm' ? "text-xs w-8" : "text-sm w-10"
        )}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// ========================================
// DATE DISPLAY
// ========================================

interface DateDisplayProps {
  date: Date | null | undefined
  showIcon?: boolean
  showRelative?: boolean
  format?: string
}

export function DateDisplay({ 
  date, 
  showIcon = false, 
  showRelative = false,
  format: dateFormat = 'MMM d, yyyy' 
}: DateDisplayProps) {
  if (!date) {
    return <span className="text-muted-foreground text-sm">—</span>
  }
  
  const dateObj = new Date(date)
  const now = new Date()
  const isOverdue = dateObj < now
  const isToday = dateObj.toDateString() === now.toDateString()
  const isTomorrow = dateObj.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  
  let displayText: string
  if (showRelative) {
    if (isToday) displayText = 'Today'
    else if (isTomorrow) displayText = 'Tomorrow'
    else displayText = format(dateObj, dateFormat)
  } else {
    displayText = format(dateObj, dateFormat)
  }
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-sm",
      isOverdue && !isToday ? "text-destructive" : "text-foreground"
    )}>
      {showIcon && <Calendar className="w-3.5 h-3.5" />}
      {displayText}
    </span>
  )
}

// ========================================
// TASK COUNT
// ========================================

interface TaskCountProps {
  total: number
  completed: number
  size?: 'sm' | 'md'
}

export function TaskCount({ total, completed, size = 'sm' }: TaskCountProps) {
  return (
    <span className={cn(
      "text-muted-foreground tabular-nums",
      size === 'sm' ? "text-xs" : "text-sm"
    )}>
      {completed}/{total} tasks
    </span>
  )
}

// ========================================
// ICON DISPLAY
// ========================================

interface IconDisplayProps {
  icon?: string | null
  color?: string | null
  size?: 'sm' | 'md' | 'lg'
  fallback?: React.ReactNode
}

export function IconDisplay({ icon, color, size = 'md', fallback }: IconDisplayProps) {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }
  
  if (!icon) {
    return fallback ? <>{fallback}</> : null
  }
  
  return (
    <span 
      className={cn("flex items-center justify-center", sizeClasses[size])}
      style={color ? { color } : undefined}
    >
      {icon}
    </span>
  )
}
