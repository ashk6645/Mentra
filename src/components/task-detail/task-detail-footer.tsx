'use client'

import { format, isValid } from 'date-fns'

interface Task {
  id: string
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
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
      return format(dateObj, 'MMM d, yyyy')
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="border-t border-border/50 p-6 bg-muted/20">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Created {formatDate(task.createdAt)}
        </div>
        <div>
          Updated {formatDate(task.updatedAt)}
        </div>
      </div>
    </div>
  )
}
