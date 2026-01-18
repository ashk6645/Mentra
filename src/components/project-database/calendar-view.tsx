'use client'

import React, { useMemo, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWeekend,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjectDatabase } from './project-database-context'
import { StatusBadge, PriorityBadge } from './cell-renderers'
import {
  ProjectDatabaseItem,
  CalendarViewProps,
  STATUS_CONFIG,
} from './types'

// ========================================
// CALENDAR VIEW
// ========================================

export function CalendarView({
  initialDate,
  onProjectClick,
  onDateClick,
}: CalendarViewProps) {
  const { projects, createProject } = useProjectDatabase()

  const [currentDate, setCurrentDate] = useState(initialDate || new Date())

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  // Group projects by date
  const projectsByDate = useMemo(() => {
    const map = new Map<string, ProjectDatabaseItem[]>()

    projects.forEach((project) => {
      // Add to target date
      if (project.targetDate) {
        const dateKey = format(new Date(project.targetDate), 'yyyy-MM-dd')
        if (!map.has(dateKey)) map.set(dateKey, [])
        map.get(dateKey)!.push(project)
      }

      // Add to start date
      if (project.startDate) {
        const dateKey = format(new Date(project.startDate), 'yyyy-MM-dd')
        if (!map.has(dateKey)) map.set(dateKey, [])
        const existing = map.get(dateKey)!
        if (!existing.some((p) => p.id === project.id)) {
          existing.push(project)
        }
      }
    })

    return map
  }, [projects])

  // Navigation
  const navigatePrev = () => setCurrentDate((prev) => subMonths(prev, 1))
  const navigateNext = () => setCurrentDate((prev) => addMonths(prev, 1))
  const navigateToday = () => setCurrentDate(new Date())

  // Handle date click
  const handleDateClick = (date: Date) => {
    onDateClick?.(date)
  }

  // Handle quick create
  const handleQuickCreate = async (date: Date) => {
    await createProject({
      name: 'New Project',
      targetDate: date,
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={navigatePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={navigateNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {projects.filter((p) => p.targetDate).length} projects with deadlines
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {/* Weekday Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayProjects = projectsByDate.get(dateKey) || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            const isWeekendDay = isWeekend(day)

            return (
              <CalendarDay
                key={dateKey}
                date={day}
                projects={dayProjects}
                isCurrentMonth={isCurrentMonth}
                isToday={isCurrentDay}
                isWeekend={isWeekendDay}
                onDateClick={handleDateClick}
                onProjectClick={onProjectClick}
                onQuickCreate={handleQuickCreate}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ========================================
// CALENDAR DAY CELL
// ========================================

interface CalendarDayProps {
  date: Date
  projects: ProjectDatabaseItem[]
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  onDateClick: (date: Date) => void
  onProjectClick?: (project: ProjectDatabaseItem) => void
  onQuickCreate: (date: Date) => void
}

function CalendarDay({
  date,
  projects,
  isCurrentMonth,
  isToday,
  isWeekend,
  onDateClick,
  onProjectClick,
  onQuickCreate,
}: CalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false)

  const displayedProjects = projects.slice(0, 3)
  const remainingCount = projects.length - displayedProjects.length

  return (
    <div
      className={cn(
        'bg-background min-h-[120px] p-2 flex flex-col gap-1 relative group cursor-pointer transition-colors',
        !isCurrentMonth && 'opacity-40',
        isToday && 'ring-2 ring-primary ring-inset',
        isWeekend && 'bg-muted/30',
        'hover:bg-accent/50'
      )}
      onClick={() => onDateClick(date)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Date Number */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-sm font-medium',
            isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs'
          )}
        >
          {format(date, 'd')}
        </span>

        {/* Quick Add Button */}
        {isHovered && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onQuickCreate(date)
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Projects */}
      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        {displayedProjects.map((project) => (
          <TooltipProvider key={project.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onProjectClick?.(project)
                  }}
                  className={cn(
                    'text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors',
                    STATUS_CONFIG[project.status].bgColor,
                    STATUS_CONFIG[project.status].color,
                    'hover:brightness-95'
                  )}
                >
                  <span className="flex items-center gap-1">
                    {project.icon && <span className="text-[10px]">{project.icon}</span>}
                    <span className="truncate">{project.name}</span>
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {project.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={project.status} size="sm" />
                    <PriorityBadge priority={project.priority} size="sm" />
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Remaining Count */}
        {remainingCount > 0 && (
          <div className="text-[10px] text-muted-foreground px-1.5">
            +{remainingCount} more
          </div>
        )}
      </div>
    </div>
  )
}