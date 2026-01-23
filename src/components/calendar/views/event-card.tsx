'use client'

import { cn } from '@/lib/utils'

interface EventCardProps {
    event: any
    compact?: boolean
}

export function EventCard({ event, compact = false }: EventCardProps) {
    // Determine color based on priority or type if available
    const getEventColor = () => {
        switch (event.priority) {
            case 'urgent': return 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
            case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400'
            case 'medium': return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
            default: return 'bg-primary/10 border-primary/20 text-primary dark:text-primary'
        }
    }

    const baseClasses = "text-xs rounded px-1.5 py-0.5 truncate border cursor-pointer hover:opacity-80 transition-opacity"
    const colorClasses = getEventColor()

    if (compact) {
        return (
            <div className={cn("w-2 h-2 rounded-full", colorClasses.split(' ')[0].replace('/10', ''))} title={event.title} />
        )
    }

    return (
        <div className={cn(baseClasses, colorClasses)}>
            {event.title}
        </div>
    )
}
