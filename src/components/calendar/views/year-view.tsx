'use client'

import { format, startOfYear, eachMonthOfInterval, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface YearViewProps {
    currentDate: Date
    tasks: any[]
}

export function YearView({ currentDate, tasks }: YearViewProps) {
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    // Helper to render mini month
    const MiniMonth = ({ date }: { date: Date }) => {
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(date)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)
        const days = eachDayOfInterval({ start: startDate, end: endDate })

        return (
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm pl-1">{format(date, 'MMMM')}</h3>
                <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
                    {weekDays.map((d, i) => (
                        <div key={`${d}-${i}`} className="text-muted-foreground font-medium">{d}</div>
                    ))}
                    {days.map(day => {
                        const isCurrentMonth = isSameMonth(day, date)
                        const hasTask = tasks.some(t => t.dueDate && isSameDay(new Date(t.dueDate), day))

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "h-6 w-6 flex items-center justify-center rounded-full mx-auto relative transition-colors",
                                    !isCurrentMonth && "text-muted-foreground/30",
                                    isToday(day) && "bg-primary text-primary-foreground font-bold",
                                    !isToday(day) && hasTask && isCurrentMonth && "bg-primary/15 font-bold text-foreground"
                                )}
                            >
                                {format(day, 'd')}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 max-w-7xl mx-auto">
                {months.map(month => (
                    <MiniMonth key={month.toString()} date={month} />
                ))}
            </div>
        </div>
    )
}
