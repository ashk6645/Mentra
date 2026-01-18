'use client'

import { format, startOfWeek, addDays, addHours, isSameDay, setHours } from 'date-fns'
import { TimeBlock } from './TimeBlock'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  currentDate: Date
  tasks: any[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_IN_WEEK = 7

export function WeekView({ currentDate, tasks }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  return (
    <div className="flex flex-col h-full">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-20">
        <div className="w-16 border-r" />
        {Array.from({ length: DAYS_IN_WEEK }).map((_, dayIndex) => {
          const day = addDays(weekStart, dayIndex)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={dayIndex}
              className={cn(
                "p-2 text-center border-r",
                isToday && "bg-primary/10"
              )}
            >
              <div className="text-sm font-medium text-muted-foreground">{format(day, 'EEE')}</div>
              <div className={cn(
                "text-2xl font-semibold",
                isToday && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 relative">
          {/* Time Labels */}
          <div className="w-16 sticky left-0 bg-background z-10">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="h-16 border-b border-r text-xs text-muted-foreground p-1 text-right pr-2"
              >
                {format(setHours(new Date(), hour), 'h a')}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {Array.from({ length: DAYS_IN_WEEK }).map((_, dayIndex) => (
            <div key={dayIndex} className="border-r relative">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="h-16 border-b hover:bg-accent/30 transition-colors"
                />
              ))}

              {/* Render tasks for this day */}
              {tasks
                .filter(task => 
                  task.scheduledStart && 
                  isSameDay(new Date(task.scheduledStart), addDays(weekStart, dayIndex))
                )
                .map(task => (
                  <TimeBlock key={task.id} task={task} />
                ))
              }

              {/* Current time indicator */}
              {isSameDay(addDays(weekStart, dayIndex), new Date()) && (
                <CurrentTimeIndicator />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CurrentTimeIndicator() {
  const now = new Date()
  const hour = now.getHours()
  const minutes = now.getMinutes()
  const top = (hour * 64) + (minutes / 60 * 64)

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  )
}
