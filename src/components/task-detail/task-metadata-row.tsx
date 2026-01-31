'use client'

import { useState } from 'react'
import { Calendar, Clock, Flag, Tag } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  dueDate?: Date | null
  priority?: string | null
  tags?: any[]
}

interface TaskMetadataRowProps {
  task: Task
}

export function TaskMetadataRow({ task }: TaskMetadataRowProps) {
  const [dueDate, setDueDate] = useState<Date | null>(task.dueDate || null)
  const [priority, setPriority] = useState(task.priority || 'none')

  const formatDueDate = (date: Date | null) => {
    if (!date) return 'Unscheduled'
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200/50 dark:border-red-900/30'
      case 'high':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30'
      case 'medium':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30'
      case 'low':
        return 'bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200/50 dark:border-slate-900/30'
      default:
        return 'bg-muted/50 text-muted-foreground/70 border-border/30'
    }
  }

  const handleDateChange = async (date: Date | undefined) => {
    const newDate = date || null
    setDueDate(newDate)
    
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDate }),
      })
    } catch (error) {
      console.error('Failed to update due date:', error)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    setPriority(newPriority)
    
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
    } catch (error) {
      console.error('Failed to update priority:', error)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Due Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-3 rounded-full border text-xs font-medium transition-all',
              !dueDate && 'text-muted-foreground/60 border-border/30 hover:border-border/50'
            )}
          >
            <Calendar className="mr-1.5 h-3 w-3" />
            {formatDueDate(dueDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={dueDate || undefined}
            onSelect={handleDateChange}
            initialFocus
          />
          {dueDate && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(undefined)}
                className="w-full"
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Time (if date is set) */}
      {dueDate && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 rounded-full border text-xs font-medium text-muted-foreground/60 border-border/30 hover:border-border/50 transition-all"
        >
          <Clock className="mr-1.5 h-3 w-3" />
          Add time
        </Button>
      )}

      {/* Priority */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-7 px-3 rounded-full border text-xs font-medium transition-all', getPriorityColor(priority))}
          >
            <Flag className="mr-1.5 h-3 w-3" />
            {priority === 'none' ? 'Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {['urgent', 'high', 'medium', 'low', 'none'].map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => handlePriorityChange(p)}
                className={cn(
                  'w-full justify-start',
                  priority === p && 'bg-accent'
                )}
              >
                <Flag className="mr-2 h-3.5 w-3.5" />
                {p === 'none' ? 'No priority' : p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Tags */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-3 rounded-full border text-xs font-medium text-muted-foreground/60 border-border/30 hover:border-border/50 transition-all"
      >
        <Tag className="mr-1.5 h-3 w-3" />
        Add label
      </Button>
    </div>
  )
}
