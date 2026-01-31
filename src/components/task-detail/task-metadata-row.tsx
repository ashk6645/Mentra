'use client'

import { useState, useTransition, useEffect } from 'react'
import { Calendar, Clock, Flag, Tag, Loader2 } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { updateTask } from '@/lib/actions/tasks'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useToast } from '@/components/ui/use-toast'

interface Task {
  id: string
  dueDate?: Date | string | null
  priority?: string | null
  tags?: any[]
  scheduledStart?: Date | string | null
  scheduledEnd?: Date | string | null
}

interface TaskMetadataRowProps {
  task: Task
}

export function TaskMetadataRow({ task }: TaskMetadataRowProps) {
  // Normalize dates - handle both Date objects and ISO strings
  const normalizeDueDate = (date: Date | string | null | undefined): Date | null => {
    if (!date) return null
    return date instanceof Date ? date : new Date(date)
  }

  const [dueDate, setDueDate] = useState<Date | null>(normalizeDueDate(task.dueDate))
  const [priority, setPriority] = useState(task.priority || 'none')
  const [time, setTime] = useState<string>(
    task.scheduledStart ? format(new Date(task.scheduledStart), 'HH:mm') : ''
  )
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { selectTask } = useTaskDetailStore()
  const { toast } = useToast()

  // Sync local state when task prop changes
  useEffect(() => {
    setDueDate(normalizeDueDate(task.dueDate))
    setPriority(task.priority || 'none')
    setTime(task.scheduledStart ? format(new Date(task.scheduledStart), 'HH:mm') : '')
  }, [task.id, task.dueDate, task.priority, task.scheduledStart])

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
    
    startTransition(async () => {
      const result = await updateTask({
        id: task.id,
        dueDate: newDate ? newDate.toISOString() : null,
      })

      if (result.success) {
        // Update the store with the new task data
        selectTask(task.id, { ...task, dueDate: newDate })
        toast({
          title: 'Date updated',
          description: newDate ? `Due date set to ${format(newDate, 'MMM d, yyyy')}` : 'Due date cleared',
        })
      } else {
        setDueDate(normalizeDueDate(task.dueDate))
        toast({
          title: 'Failed to update date',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    })
  }

  const handlePriorityChange = async (newPriority: string) => {
    const oldPriority = priority
    setPriority(newPriority)
    
    startTransition(async () => {
      const result = await updateTask({
        id: task.id,
        priority: newPriority === 'none' ? null : (newPriority as any),
      })

      if (result.success) {
        selectTask(task.id, { ...task, priority: newPriority === 'none' ? null : newPriority })
        toast({
          title: 'Priority updated',
          description: `Priority set to ${newPriority === 'none' ? 'none' : newPriority}`,
        })
      } else {
        setPriority(oldPriority)
        toast({
          title: 'Failed to update priority',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    })
  }

  const handleTimeChange = async (timeValue: string) => {
    if (!dueDate || !timeValue) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const scheduledStart = new Date(dueDate)
    scheduledStart.setHours(hours, minutes, 0, 0)

    setTime(timeValue)
    setShowTimeInput(false)

    startTransition(async () => {
      const result = await updateTask({
        id: task.id,
        scheduledStart: scheduledStart.toISOString(),
      })

      if (result.success) {
        selectTask(task.id, { ...task, scheduledStart })
        toast({
          title: 'Time added',
          description: `Scheduled for ${format(scheduledStart, 'h:mm a')}`,
        })
      } else {
        setTime(task.scheduledStart ? format(new Date(task.scheduledStart), 'HH:mm') : '')
        toast({
          title: 'Failed to add time',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    })
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
        <Popover open={showTimeInput} onOpenChange={setShowTimeInput}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className={cn(
                'h-7 px-3 rounded-full border text-xs font-medium transition-all',
                time
                  ? 'text-foreground border-border/50'
                  : 'text-muted-foreground/60 border-border/30 hover:border-border/50'
              )}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Clock className="mr-1.5 h-3 w-3" />
              )}
              {time || 'Add time'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
              {time && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTime('')
                    setShowTimeInput(false)
                    startTransition(async () => {
                      await updateTask({
                        id: task.id,
                        scheduledStart: null,
                      })
                      selectTask(task.id, { ...task, scheduledStart: null })
                    })
                  }}
                  className="w-full"
                >
                  Clear time
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
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
      <Popover open={showTagInput} onOpenChange={setShowTagInput}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className="h-7 px-3 rounded-full border text-xs font-medium text-muted-foreground/60 border-border/30 hover:border-border/50 transition-all"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Tag className="mr-1.5 h-3 w-3" />
            )}
            Add label
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tag functionality coming soon
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
