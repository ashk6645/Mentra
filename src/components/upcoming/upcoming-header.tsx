'use client'

import { CalendarDays } from 'lucide-react'
import { format, startOfDay, addDays } from 'date-fns'

interface UpcomingHeaderProps {
    start: Date
    end: Date
    totalTasks: number
}

export function UpcomingHeader({ start, end, totalTasks }: UpcomingHeaderProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-purple-500 fill-purple-500/10" />
                <h1 className="text-3xl font-bold text-foreground">Upcoming</h1>
            </div>

            <div className="h-px w-24 bg-border/50 my-2" />

            <p className="text-lg text-muted-foreground font-medium">
                {format(start, 'MMM d')} - {format(end, 'MMM d')}
            </p>

            <p className="text-sm text-muted-foreground">
                {totalTasks} tasks scheduled
            </p>
        </div>
    )
}
