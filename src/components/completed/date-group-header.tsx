'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateGroupHeaderProps {
    date: Date
    type: 'today' | 'yesterday' | 'date'
    taskCount: number
}

export function DateGroupHeader({ date, type, taskCount }: DateGroupHeaderProps) {
    const dayName = format(date, 'EEEE')
    const dateStr = format(date, 'd MMM')

    let displayText = ''

    if (type === 'today') {
        displayText = `${dateStr} · Today · ${dayName}`
    } else if (type === 'yesterday') {
        displayText = `${dateStr} · Yesterday · ${dayName}`
    } else {
        displayText = `${dateStr} · ${dayName}`
    }

    return (
        <div className="mb-4 pb-2 border-b border-border/30">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80">
                    {displayText}
                </h3>
                <span className="text-xs text-muted-foreground">
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                </span>
            </div>
        </div>
    )
}
