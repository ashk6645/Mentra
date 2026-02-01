'use client'

import { useRouter } from 'next/navigation'

import { useState, useTransition, useEffect } from 'react'
import { Calendar, Clock, Flag, Tag, Loader2, Check, X } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { updateTask, UpdateTaskInput } from '@/lib/actions/tasks'
import { getTags } from '@/lib/actions/tags'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useToast } from '@/components/ui/use-toast'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'

interface TaskTag {
  tag?: { id: string; name: string; color?: string | null };
  id?: string;
}

interface Task {
  id: string
  dueDate?: Date | string | null
  priority?: string | null
  tags?: TaskTag[]
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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<{ id: string, name: string, color?: string | null }[]>([])

  const [showTagInput, setShowTagInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { selectTask } = useTaskDetailStore()
  const { toast } = useToast()
  const router = useRouter() // Add router

  // Sync local state when task prop changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setDueDate(normalizeDueDate(task.dueDate))
    setPriority(task.priority || 'none')
    setTime(task.scheduledStart ? format(new Date(task.scheduledStart), 'HH:mm') : '')

    // Extract tag IDs from task.tags which might be TaskTagWithTag[] or similar
    // We assume backend returns tags structure as requested
    const tags = task.tags?.map((t) => t.tag?.id || t.id).filter(Boolean) as string[] || []
    setSelectedTagIds(tags)
  }, [task.id, task.dueDate, task.priority, task.scheduledStart, task.tags])

  // Fetch available tags
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getTags()
      setAvailableTags(tags)
    }
    loadTags()
  }, [])

  const formatDueDate = (date: Date | null) => {
    if (!date) return 'Unscheduled'

    let dateStr = ''
    if (isToday(date)) dateStr = 'Today'
    else if (isTomorrow(date)) dateStr = 'Tomorrow'
    else dateStr = format(date, 'MMM d')

    if (time) {
      return `${dateStr}, ${time}`
    }

    return dateStr
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

    // Calculate new scheduledStart if exists to keep time on the new date
    let newScheduledStart: Date | null | undefined = undefined
    if (task.scheduledStart && newDate) {
      const oldStart = new Date(task.scheduledStart)
      newScheduledStart = new Date(newDate)
      newScheduledStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
    } else if (!newDate) {
      // If due date is cleared, also clear scheduled time
      newScheduledStart = null
    }

    startTransition(async () => {
      const payload: UpdateTaskInput = {
        id: task.id,
        dueDate: newDate ? newDate.toISOString() : null,
      }

      if (newScheduledStart !== undefined) {
        payload.scheduledStart = newScheduledStart ? newScheduledStart.toISOString() : null
      }

      const result = await updateTask(payload)

      if (result.success && result.data) {
        // Update the store with the new task data
        selectTask(task.id, result.data)
        router.refresh() // Refresh server components
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
        priority: newPriority === 'none' ? null : (newPriority as any // eslint-disable-line @typescript-eslint/no-explicit-any
        ),
      })

      if (result.success && result.data) {
        selectTask(task.id, result.data)
        router.refresh() // Refresh server components
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

  const saveTime = async (timeValue: string) => {
    if (!dueDate || !timeValue) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    // If we have a due date, use it, otherwise use today or tomorrow
    const baseDate = dueDate || new Date()
    const scheduledStart = new Date(baseDate)
    scheduledStart.setHours(hours, minutes, 0, 0)

    startTransition(async () => {
      // If we didn't have a due date, set it now
      const updatePayload: UpdateTaskInput = {
        id: task.id,
        scheduledStart: scheduledStart.toISOString(),
      }

      if (!dueDate) {
        updatePayload.dueDate = scheduledStart.toISOString()
        setDueDate(scheduledStart)
      }

      const result = await updateTask(updatePayload)

      if (result.success && result.data) {
        selectTask(task.id, result.data)
        router.refresh() // Refresh server components
        toast({
          title: 'Time updated',
          description: `Scheduled for ${format(scheduledStart, 'h:mm a')}`,
        })
      } else {
        setTime(task.scheduledStart ? format(new Date(task.scheduledStart), 'HH:mm') : '')
        toast({
          title: 'Failed to update time',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
      }
    })
  }

  const handleTimeChange = (timeValue: string) => {
    setTime(timeValue)
  }

  const handleTagToggle = async (tagId: string) => {
    const newTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]

    setSelectedTagIds(newTags)

    startTransition(async () => {
      const result = await updateTask({
        id: task.id,
        tagIds: newTags
      })

      if (result.success && result.data) {
        selectTask(task.id, result.data)
        router.refresh() // Refresh server components
      } else {
        // Revert on failure
        setSelectedTagIds(selectedTagIds)
        toast({
          title: 'Failed to update tags',
          variant: 'destructive'
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
          <div className="p-3 border-t bg-muted/10 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Time</label>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  onBlur={(e) => saveTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            {dueDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(undefined)}
                className="w-full text-xs h-8 text-muted-foreground hover:text-destructive"
              >
                Clear date & time
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

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
        <PopoverContent className="w-52 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search labels..." />
            <CommandList>
              <CommandEmpty>No labels found.</CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleTagToggle(tag.id)}
                    className="cursor-pointer"
                  >
                    <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                      <Check
                        className={cn(
                          "h-3 w-3",
                          selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <span>{tag.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tag Badges */}
      {selectedTagIds.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {selectedTagIds.map(tagId => {
            const tag = availableTags.find(t => t.id === tagId) || task.tags?.find((t) => (t.tag?.id || t.id) === tagId)?.tag
            if (!tag) return null
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="h-6 px-2 text-[10px] font-normal gap-1 bg-muted/40 hover:bg-muted/60"
              >
                {tag.name}
                <div
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTagToggle(tagId)
                  }}
                  className="cursor-pointer hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </div>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
