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

  const creatorName = task.user?.displayName || 'Unknown'

  return (
    <div className="border-t border-border/50 p-6 bg-muted/20">
      <div className="flex items-center justify-center text-xs text-muted-foreground w-full">
        Last Updated: {formatDate(task.updatedAt)}
      </div>
    </div>
  )
}
