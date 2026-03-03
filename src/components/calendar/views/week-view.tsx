'use client'

import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { EventCard } from './event-card'

interface WeekViewProps {
    currentDate: Date
    tasks: any[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function WeekView({ currentDate, tasks }: WeekViewProps) {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Helper to find tasks for a specific day and hour (simplified for now)
    // In a real app, you'd calculate position/height based on start/end times
    const getTasksForTimeSlot = (day: Date, hour: number) => {
        return tasks.filter(task => {
            if (!task.dueDate) return false
            const taskDate = new Date(task.dueDate)
            return isSameDay(taskDate, day) && taskDate.getHours() === hour
        })
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
            {/* Header Row */}
            <div className="flex border-b bg-background sticky top-0 z-10">
                <div className="w-16 flex-shrink-0 border-r bg-muted/20" /> {/* Time column header */}
                <div className="flex-1 grid grid-cols-7 bg-background">
                    {days.map(day => (
                        <div
                            key={day.toString()}
                            className={cn(
                                "py-3 text-center border-r last:border-r-0 flex flex-col items-center justify-center gap-1",
                                isToday(day) ? "bg-primary/5" : ""
                            )}
                        >
                            <div className="text-xs uppercase text-muted-foreground font-medium">
                                {format(day, 'EEE')}
                            </div>
                            <div
                                className={cn(
                                    "h-8 w-8 flex items-center justify-center rounded-full text-lg font-semibold",
                                    isToday(day)
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground"
                                )}
                            >
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-[64px_1fr] min-h-[1440px]"> {/* 64px for time labels, rest for content */}
                {HOURS.map(hour => (
                    <div key={hour} className="contents group">
                        {/* Time Label */}
                        <div className="border-r border-b px-2 py-2 text-xs text-center text-muted-foreground bg-muted/5 font-medium flex items-center justify-center sticky left-0">
                            <span>
                                {format(new Date().setHours(hour, 0), 'h a')}
                            </span>
                        </div>

                        {/* Days Columns for this hour */}
                        <div className="grid grid-cols-7 border-b">
                            {days.map(day => {
                                const tasks = getTasksForTimeSlot(day, hour)
                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={cn(
                                            "border-r last:border-r-0 relative hover:bg-muted/5 transition-colors p-1",
                                            isToday(day) ? "bg-primary/[0.02]" : ""
                                        )}
                                    >
                                        {tasks.map(task => (
                                            <EventCard key={task.id} event={task} />
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
