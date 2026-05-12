'use client'

import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updateTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'

interface Task {
  id: string
  description?: string | null
}

interface TaskDescriptionProps {
  task: Task
  isReadOnly?: boolean
}

const sectionLabel =
  'text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/75'

export function TaskDescription({ task, isReadOnly = false }: TaskDescriptionProps) {
  const [description, setDescription] = useState(task.description || '')
  const [isFocused, setIsFocused] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [description])

  const { selectTask } = useTaskDetailStore()

  const handleBlur = async () => {
    setIsFocused(false)

    if (description === task.description) return

    setIsSaving(true)
    try {
      const result = await updateTask({
        id: task.id,
        description: description,
      })

      if (result.success && result.data) {
        selectTask(task.id, result.data)
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
    <section className="space-y-2 border-t border-border/30 pt-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className={sectionLabel}>Description</h2>
        {isSaving && (
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">Saving…</span>
        )}
      </div>

      <div
        className={cn(
          '-mx-1 rounded-lg px-1 transition-colors duration-150',
          isFocused ? 'bg-muted/25' : 'bg-transparent hover:bg-muted/[0.08]'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={isReadOnly ? 'No description' : 'Add details…'}
          disabled={isReadOnly}
          className={cn(
            'min-h-[72px] resize-none',
            'border-0 bg-transparent shadow-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-muted-foreground/45',
            'text-[15px] leading-[1.6] text-foreground/95',
            'px-2 py-2',
            'overflow-hidden',
            isReadOnly && 'cursor-default opacity-60'
          )}
        />
      </div>
    </section>
  )
}
