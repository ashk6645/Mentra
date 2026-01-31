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
        description: description || undefined,
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
          Description
        </label>
        {isSaving && (
          <span className="text-xs text-muted-foreground/60">Saving...</span>
        )}
      </div>
      
      <div className={cn(
        'rounded-lg transition-all duration-200',
        isFocused ? 'bg-muted/20' : 'bg-transparent'
      )}>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="Add notes, context, or steps…"
          className={cn(
            'min-h-[140px] resize-none',
            'border-0 shadow-none',
            'bg-transparent',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-muted-foreground/40',
            'text-[15px] leading-relaxed',
            'px-3 py-2.5',
            'transition-all duration-200'
          )}
        />
      </div>

      <p className="text-[11px] text-muted-foreground/50">
        Supports markdown formatting
      </p>
    </div>
  )
}
