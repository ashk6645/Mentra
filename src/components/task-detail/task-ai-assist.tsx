'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronDown, ChevronUp, ListTree, Wand2, Clock, Flag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { generateSubtasks, rewriteTaskTitle, estimateTaskDuration, getTaskSuggestions } from '@/lib/actions/ai'
import { createSubtask } from '@/lib/actions/subtasks'
import { updateTask } from '@/lib/actions/tasks'
import { getTags } from '@/lib/actions/tags'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useRouter } from 'next/navigation'

interface TaskTag {
  tag?: { id: string; name: string };
  id?: string;
}

interface Task {
  id: string
  title: string
  description?: string | null
  scheduledStart?: Date | string | null
  tags?: TaskTag[]
}

interface TaskAIAssistProps {
  task: Task
}

export function TaskAIAssist({ task }: TaskAIAssistProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null) // Store loading action name
  const { toast } = useToast()
  const { selectTask } = useTaskDetailStore()
  const router = useRouter()

  const handleBreakIntoSubtasks = async () => {
    setIsLoading('break-into-subtasks')
    try {
      const subtasks = await generateSubtasks(task.title, task.description || undefined)

      if (subtasks.length === 0) {
        toast({ title: 'No subtasks generated', description: 'Try adding more details to the task.' })
        return
      }

      let createdCount = 0
      for (const sub of subtasks) {
        const result = await createSubtask(task.id, sub.title)
        if (result.success) createdCount++
      }

      if (createdCount > 0) {
        toast({ title: 'Subtasks created', description: `Added ${createdCount} subtasks.` })
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Failed to generate subtasks', variant: 'destructive' })
    } finally {
      setIsLoading(null)
    }
  }

  const handleRewriteClearly = async () => {
    setIsLoading('rewrite-clearly')
    try {
      const newTitle = await rewriteTaskTitle(task.title)
      if (newTitle) {
        const result = await updateTask({ id: task.id, title: newTitle })
        if (result.success && result.data) {
          selectTask(task.id, result.data)
          router.refresh()
          toast({ title: 'Task renamed', description: 'Title updated for clarity.' })
        }
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Failed to rewrite title', variant: 'destructive' })
    } finally {
      setIsLoading(null)
    }
  }

  const handleEstimateTime = async () => {
    setIsLoading('estimate-time')
    try {
      const minutes = await estimateTaskDuration(task.title, task.description || undefined)
      if (minutes) {
        const updateData: any = { id: task.id, durationMinutes: minutes }

        // If scheduled, update end time
        if (task.scheduledStart) {
          const start = new Date(task.scheduledStart)
          const end = new Date(start.getTime() + minutes * 60000)
          updateData.scheduledEnd = end.toISOString()
        }

        const result = await updateTask(updateData)
        if (result.success && result.data) {
          selectTask(task.id, result.data)
          router.refresh()
          toast({ title: 'Duration estimated', description: `Set to ${minutes} minutes.` })
        }
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Failed to estimate time', variant: 'destructive' })
    } finally {
      setIsLoading(null)
    }
  }

  const handleSuggestPriority = async () => {
    setIsLoading('suggest-priority')
    try {
      const availableTags = await getTags()
      const suggestions = await getTaskSuggestions(
        task.title,
        task.description || undefined,
        availableTags.map(t => ({ id: t.id, name: t.name }))
      )

      const updateData: any = { id: task.id }
      let updated = false

      if (suggestions.priority) {
        updateData.priority = suggestions.priority.toLowerCase() // Ensure lowercase match with schema enum
        updated = true
      }

      if (suggestions.tagIds && suggestions.tagIds.length > 0) {
        // Merge with existing tags
        const currentTagIds = task.tags?.map(t => t.tag?.id || t.id).filter(Boolean) as string[] || []
        const newTagIds = Array.from(new Set([...currentTagIds, ...suggestions.tagIds]))
        updateData.tagIds = newTagIds
        updated = true
      }

      if (updated) {
        const result = await updateTask(updateData)
        if (result.success && result.data) {
          selectTask(task.id, result.data)
          router.refresh()
          toast({
            title: 'Task updated',
            description: `Applied ${suggestions.priority ? 'priority' : ''} ${suggestions.tagIds?.length ? '& tags' : ''}`
          })
        }
      } else {
        toast({ title: 'No suggestions found', description: 'AI could not find better metadata.' })
      }

    } catch (error) {
      console.error(error)
      toast({ title: 'Failed to suggest metadata', variant: 'destructive' })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 rounded-lg border border-border/25 hover:border-primary/30 hover:bg-primary/5 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Assist</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBreakIntoSubtasks}
            disabled={!!isLoading}
            className="w-full justify-start h-auto py-3 text-left relative"
          >
            {isLoading === 'break-into-subtasks' ? (
              <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <ListTree className="mr-3 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">Break into subtasks</div>
              <div className="text-xs text-muted-foreground">
                AI suggests logical steps
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRewriteClearly}
            disabled={!!isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            {isLoading === 'rewrite-clearly' ? (
              <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Wand2 className="mr-3 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">Rewrite clearly</div>
              <div className="text-xs text-muted-foreground">
                Make task title more actionable
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleEstimateTime}
            disabled={!!isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            {isLoading === 'estimate-time' ? (
              <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Clock className="mr-3 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">Estimate time</div>
              <div className="text-xs text-muted-foreground">
                How long will this take?
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSuggestPriority}
            disabled={!!isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            {isLoading === 'suggest-priority' ? (
              <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Flag className="mr-3 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">Suggest priority</div>
              <div className="text-xs text-muted-foreground">
                Based on urgency and impact
              </div>
            </div>
          </Button>
        </div>
      )}
    </div>
  )
}
