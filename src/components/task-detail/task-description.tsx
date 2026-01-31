'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updateTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  description?: string | null
}

interface TaskDescriptionProps {
  task: Task
}

export function TaskDescription({ task }: TaskDescriptionProps) {
  const [description, setDescription] = useState(task.description || '')
  const [isFocused, setIsFocused] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleBlur = async () => {
    setIsFocused(false)
    
    if (description === task.description) return

    setIsSaving(true)
    try {
      const result = await updateTask({
        id: task.id,
        description: description || null,
      })

      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to update description:', result.error)
      }
    } catch (error) {
      console.error('Failed to update description:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          Description
        </label>
        {isSaving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
      </div>
      
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder="Add notes, context, or steps…"
        className={cn(
          'min-h-[120px] resize-none',
          'border-border/50 focus:border-primary/50',
          'bg-muted/30 focus:bg-background',
          'transition-all duration-200',
          !description && !isFocused && 'text-muted-foreground/50'
        )}
      />

      <p className="text-xs text-muted-foreground">
        Supports markdown formatting
      </p>
    </div>
  )
}
