'use client'

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { EventCard } from './event-card'

interface MonthViewProps {
    currentDate: Date
    tasks: any[]
}

export function MonthView({ currentDate, tasks }: MonthViewProps) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const dateFormat = "d"
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    // Helper to find tasks for a specific day
    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => {
            if (!task.dueDate) return false
            return isSameDay(new Date(task.dueDate), day)
        })
    }

    return (
        <div className="flex flex-col h-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6">
                {days.map((day, dayIdx) => {
                    const dayTasks = getTasksForDay(day)
                    const isCurrentMonth = isSameMonth(day, monthStart)

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "border-b border-r p-2 flex flex-col min-h-[100px] transition-colors hover:bg-muted/10 relative group",
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                (dayIdx + 1) % 7 === 0 && "border-r-0" // Remove right border for last column
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span
                                    className={cn(
                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                        isToday(day)
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                >
                                    {format(day, dateFormat)}
                                </span>
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[100px] no-scrollbar">
                                {dayTasks.map(task => (
                                    <EventCard key={task.id} event={task} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
