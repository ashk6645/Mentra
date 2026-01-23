'use client'

import { format, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { EventCard } from './event-card'

interface DayViewProps {
    currentDate: Date
    tasks: any[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function DayView({ currentDate, tasks }: DayViewProps) {
    // Helper to find tasks for a specific hour
    const getTasksForTimeSlot = (hour: number) => {
        return tasks.filter(task => {
            if (!task.dueDate) return false
            const taskDate = new Date(task.dueDate)
            return isSameDay(taskDate, currentDate) && taskDate.getHours() === hour
        })
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex border-b bg-background py-4 px-6 items-center gap-4">
                <div
                    className={cn(
                        "h-12 w-12 flex items-center justify-center rounded-full text-2xl font-bold",
                        isToday(currentDate)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                    )}
                >
                    {format(currentDate, 'd')}
                </div>
                <div>
                    <h2 className="text-xl font-semibold">{format(currentDate, 'EEEE')}</h2>
                    <p className="text-sm text-muted-foreground">My Schedule</p>
                </div>
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[80px_1fr] min-h-[1440px]">
                    {HOURS.map(hour => (
                        <div key={hour} className="contents group">
                            {/* Time Label */}
                            <div className="border-r border-b px-4 py-4 text-sm text-right text-muted-foreground bg-muted/5 font-medium">
                                {format(new Date().setHours(hour, 0), 'h a')}
                            </div>

                            {/* Content Slot */}
                            <div className="border-b relative hover:bg-muted/5 transition-colors p-2">
                                {/* Horizontal time line guide */}
                                <div className="absolute top-1/2 w-full border-t border-dashed border-border/30 opacity-0 group-hover:opacity-100 pointer-events-none" />

                                {getTasksForTimeSlot(hour).map(task => (
                                    <div key={task.id} className="mb-1">
                                        <EventCard event={task} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
