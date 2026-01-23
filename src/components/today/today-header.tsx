'use client'

import { Sun } from 'lucide-react'
import { format } from 'date-fns'

interface TodayHeaderProps {
    date: Date
    totalTasks: number
    highPriorityCount: number
}

export function TodayHeader({ date, totalTasks, highPriorityCount }: TodayHeaderProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <div className="flex items-center gap-2">
                <Sun className="h-6 w-6 text-orange-400 fill-orange-400" />
                <h1 className="text-3xl font-bold text-foreground">Today</h1>
            </div>

            <div className="h-px w-24 bg-border/50 my-2" />

            <p className="text-lg text-muted-foreground font-medium">
                {format(date, 'EEEE, d MMM')}
            </p>

            <p className="text-sm text-muted-foreground">
                {totalTasks} tasks • {highPriorityCount} high priority
            </p>
        </div>
    )
}
