'use client'

import { isValid, formatDistanceToNow } from 'date-fns'

interface Task {
  id: string
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  user?: {
    displayName: string | null
    email: string
    avatarUrl: string | null
  } | null
}

interface TaskDetailFooterProps {
  task: Task
}

export function TaskDetailFooter({ task }: TaskDetailFooterProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown'

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (!isValid(dateObj)) return 'Unknown'
      return formatDistanceToNow(dateObj, { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <footer className="border-t border-border/30 px-5 sm:px-7 py-4 bg-transparent shrink-0">
      <p className="text-center text-[11px] text-muted-foreground/70 tabular-nums tracking-wide">
        Updated {formatDate(task.updatedAt)}
      </p>
    </footer>
  )
}
