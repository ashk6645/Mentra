'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface TimeBlockProps {
  task: any
}

export function TimeBlock({ task }: TimeBlockProps) {
  if (!task.scheduledStart || !task.durationMinutes) return null

  // Calculate position - convert to Date if string
  const startDate = task.scheduledStart instanceof Date ? task.scheduledStart : new Date(task.scheduledStart)
  const startHour = startDate.getHours()
  const startMinutes = startDate.getMinutes()
  const top = (startHour * 64) + (startMinutes / 60 * 64) // 64px per hour
  const height = Math.max((task.durationMinutes / 60) * 64, 32) // Min 32px

  const style = {
    position: 'absolute' as const,
    top: `${top}px`,
    height: `${height}px`,
    zIndex: 10,
  }

  return (
    <div
      style={style}
      className={cn(
        "left-0 right-0 mx-1 px-2 py-1 rounded border-l-4 text-sm overflow-hidden",
        "hover:shadow-lg transition-shadow",
        task.project?.color === 'blue' && "bg-blue-100 border-blue-500 dark:bg-blue-950",
        task.project?.color === 'green' && "bg-green-100 border-green-500 dark:bg-green-950",
        task.project?.color === 'red' && "bg-red-100 border-red-500 dark:bg-red-950",
        task.project?.color === 'yellow' && "bg-yellow-100 border-yellow-500 dark:bg-yellow-950",
        task.project?.color === 'purple' && "bg-purple-100 border-purple-500 dark:bg-purple-950",
        !task.project?.color && "bg-primary/10 border-primary"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{task.title}</div>
          <div className="flex items-center gap-1 text-xs opacity-75 mt-0.5">
            <Clock className="h-3 w-3" />
            {format(startDate, 'h:mm a')}
            {task.project && (
              <span className="ml-1 truncate">• {task.project.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
