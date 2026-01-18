'use client'

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  addMonths,
  subMonths,
  differenceInDays,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
} from 'date-fns'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  TimelineViewProps,
  STATUS_CONFIG,
} from './types'

// ========================================
// TIMELINE VIEW
// ========================================

export function TimelineView({ 
  startDate: initialStartDate,
  endDate: initialEndDate,
  zoom: initialZoom = 'month',
  onProjectClick,
}: TimelineViewProps) {
  const { projects, updateProject } = useProjectDatabase()
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // State
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>(initialZoom)
  const [viewDate, setViewDate] = useState(new Date())
  const [draggingProject, setDraggingProject] = useState<{
    id: string
    edge: 'start' | 'end' | 'move'
    initialX: number
    initialStart: Date | null
    initialEnd: Date | null
  } | null>(null)
  
  // Calculate date range based on zoom
  const dateRange = useMemo(() => {
    const start = startOfMonth(subMonths(viewDate, zoom === 'day' ? 0 : zoom === 'week' ? 1 : 2))
    const end = endOfMonth(addMonths(viewDate, zoom === 'day' ? 0 : zoom === 'week' ? 1 : 2))
    return { start, end }
  }, [viewDate, zoom])
  
  // Get all days in range
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  }, [dateRange])
  
  // Calculate column width based on zoom
  const columnWidth = useMemo(() => {
    switch (zoom) {
      case 'day': return 60
      case 'week': return 30
      case 'month': return 20
      default: return 30
    }
  }, [zoom])
  
  // Get projects with dates
  const projectsWithDates = useMemo(() => {
    return projects.filter(p => p.startDate || p.targetDate)
  }, [projects])
  
  // Calculate bar position and width
  const getBarStyle = useCallback((project: ProjectDatabaseItem) => {
    const projectStart = project.startDate ? new Date(project.startDate) : null
    const projectEnd = project.targetDate ? new Date(project.targetDate) : null
    
    // If no dates, don't show
    if (!projectStart && !projectEnd) return null
    
    const effectiveStart = projectStart || projectEnd!
    const effectiveEnd = projectEnd || projectStart!
    
    // Check if project is in view
    if (isAfter(effectiveStart, dateRange.end) || isBefore(effectiveEnd, dateRange.start)) {
      return null
    }
    
    const clampedStart = isBefore(effectiveStart, dateRange.start) ? dateRange.start : effectiveStart
    const clampedEnd = isAfter(effectiveEnd, dateRange.end) ? dateRange.end : effectiveEnd
    
    const startOffset = differenceInDays(clampedStart, dateRange.start)
    const duration = differenceInDays(clampedEnd, clampedStart) + 1
    
    return {
      left: startOffset * columnWidth,
      width: Math.max(duration * columnWidth, columnWidth),
    }
  }, [dateRange, columnWidth])
  
  // Navigation
  const navigatePrev = () => {
    setViewDate(prev => subMonths(prev, 1))
  }
  
  const navigateNext = () => {
    setViewDate(prev => addMonths(prev, 1))
  }
  
  const navigateToday = () => {
    setViewDate(new Date())
  }
  
  // Zoom controls
  const zoomIn = () => {
    setZoom(prev => prev === 'month' ? 'week' : prev === 'week' ? 'day' : 'day')
  }
  
  const zoomOut = () => {
    setZoom(prev => prev === 'day' ? 'week' : prev === 'week' ? 'month' : 'month')
  }
  
  // Handle drag start
  const handleDragStart = (
    e: React.MouseEvent, 
    project: ProjectDatabaseItem, 
    edge: 'start' | 'end' | 'move'
  ) => {
    e.preventDefault()
    setDraggingProject({
      id: project.id,
      edge,
      initialX: e.clientX,
      initialStart: project.startDate ? new Date(project.startDate) : null,
      initialEnd: project.targetDate ? new Date(project.targetDate) : null,
    })
  }
  
  // Handle drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingProject) return
    
    const deltaX = e.clientX - draggingProject.initialX
    const daysDelta = Math.round(deltaX / columnWidth)
    
    if (daysDelta === 0) return
    
    const project = projects.find(p => p.id === draggingProject.id)
    if (!project) return
    
    let newStart = draggingProject.initialStart
    let newEnd = draggingProject.initialEnd
    
    if (draggingProject.edge === 'start' && newStart) {
      newStart = addDays(draggingProject.initialStart!, daysDelta)
    } else if (draggingProject.edge === 'end' && newEnd) {
      newEnd = addDays(draggingProject.initialEnd!, daysDelta)
    } else if (draggingProject.edge === 'move') {
      if (newStart) newStart = addDays(draggingProject.initialStart!, daysDelta)
      if (newEnd) newEnd = addDays(draggingProject.initialEnd!, daysDelta)
    }
    
    // Ensure start is before end
    if (newStart && newEnd && newStart > newEnd) return
    
    updateProject(draggingProject.id, {
      startDate: newStart,
      targetDate: newEnd,
    })
  }, [draggingProject, columnWidth, projects, updateProject])
  
  // Handle drag end
  const handleMouseUp = () => {
    setDraggingProject(null)
  }
  
  // Group days by month for header
  const monthGroups = useMemo(() => {
    const groups: { month: Date; days: Date[] }[] = []
    let currentMonth: Date | null = null
    let currentDays: Date[] = []
    
    days.forEach(day => {
      if (!currentMonth || !isSameMonth(day, currentMonth)) {
        if (currentMonth) {
          groups.push({ month: currentMonth, days: currentDays })
        }
        currentMonth = day
        currentDays = [day]
      } else {
        currentDays.push(day)
      }
    })
    
    if (currentMonth) {
      groups.push({ month: currentMonth, days: currentDays })
    }
    
    return groups
  }, [days])

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full"
      onMouseMove={draggingProject ? handleMouseMove : undefined}
      onMouseUp={draggingProject ? handleMouseUp : undefined}
      onMouseLeave={draggingProject ? handleMouseUp : undefined}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium ml-2">
            {format(viewDate, 'MMMM yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon-sm" 
            onClick={zoomOut}
            disabled={zoom === 'month'}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center capitalize">
            {zoom}
          </span>
          <Button 
            variant="outline" 
            size="icon-sm" 
            onClick={zoomIn}
            disabled={zoom === 'day'}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="flex border-b border-border sticky top-0 bg-background z-20">
            {/* Project name column */}
            <div className="w-64 flex-shrink-0 border-r border-border" />
            
            {/* Month labels */}
            <div className="flex">
              {monthGroups.map(({ month, days: monthDays }) => (
                <div
                  key={month.toISOString()}
                  style={{ width: monthDays.length * columnWidth }}
                  className="text-xs font-medium text-muted-foreground px-2 py-1 border-r border-border"
                >
                  {format(month, 'MMMM yyyy')}
                </div>
              ))}
            </div>
          </div>
          
          {/* Day Headers */}
          <div className="flex border-b border-border sticky top-7 bg-background z-20">
            {/* Project name column header */}
            <div className="w-64 flex-shrink-0 border-r border-border px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Project</span>
            </div>
            
            {/* Day labels */}
            <div className="flex">
              {days.map(day => (
                <div
                  key={day.toISOString()}
                  style={{ width: columnWidth }}
                  className={cn(
                    "text-center text-xs py-1 border-r border-border/50",
                    isToday(day) && "bg-primary/10",
                    !isSameMonth(day, viewDate) && "text-muted-foreground/50"
                  )}
                >
                  {zoom !== 'month' && (
                    <div className="font-medium">{format(day, 'd')}</div>
                  )}
                  {zoom === 'day' && (
                    <div className="text-muted-foreground">{format(day, 'EEE')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Project Rows */}
          <TooltipProvider>
            <div className="relative">
              {projectsWithDates.map((project, index) => {
                const barStyle = getBarStyle(project)
                const statusConfig = STATUS_CONFIG[project.status]
                
                return (
                  <div
                    key={project.id}
                    className="flex border-b border-border/50 hover:bg-muted/30 transition-colors"
                    style={{ height: 48 }}
                  >
                    {/* Project name */}
                    <div 
                      className="w-64 flex-shrink-0 border-r border-border px-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => onProjectClick?.(project)}
                    >
                      {project.icon && <span>{project.icon}</span>}
                      <span className="text-sm font-medium truncate">{project.name}</span>
                    </div>
                    
                    {/* Timeline bar */}
                    <div className="flex-1 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {days.map(day => (
                          <div
                            key={day.toISOString()}
                            style={{ width: columnWidth }}
                            className={cn(
                              "border-r border-border/30 h-full",
                              isToday(day) && "bg-primary/5"
                            )}
                          />
                        ))}
                      </div>
                      
                      {/* Project bar */}
                      {barStyle && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-2 h-8 rounded-md flex items-center px-2 cursor-pointer transition-all",
                                "hover:ring-2 hover:ring-primary/30",
                                statusConfig.bgColor,
                                draggingProject?.id === project.id && "ring-2 ring-primary"
                              )}
                              style={{
                                left: barStyle.left,
                                width: barStyle.width,
                              }}
                              onClick={() => onProjectClick?.(project)}
                              onMouseDown={(e) => handleDragStart(e, project, 'move')}
                            >
                              {/* Left resize handle */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-l-md"
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  handleDragStart(e, project, 'start')
                                }}
                              />
                              
                              {/* Content */}
                              <span className={cn(
                                "text-xs font-medium truncate px-1",
                                statusConfig.color
                              )}>
                                {barStyle.width > 60 ? project.name : ''}
                              </span>
                              
                              {/* Right resize handle */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r-md"
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  handleDragStart(e, project, 'end')
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{project.name}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <StatusBadge status={project.status} size="sm" />
                                <PriorityBadge priority={project.priority} size="sm" />
                              </div>
                              {project.startDate && (
                                <p className="text-xs text-muted-foreground">
                                  Start: {format(new Date(project.startDate), 'MMM d, yyyy')}
                                </p>
                              )}
                              {project.targetDate && (
                                <p className="text-xs text-muted-foreground">
                                  Target: {format(new Date(project.targetDate), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {/* Empty state */}
              {projectsWithDates.length === 0 && (
                <div className="flex items-center justify-center py-16 text-center">
                  <div>
                    <h3 className="text-lg font-medium mb-1">No projects with dates</h3>
                    <p className="text-muted-foreground text-sm">
                      Add start or target dates to see projects on the timeline
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
