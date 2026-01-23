'use client'

import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ElementType = 'date' | 'project' | 'tag' | 'priority' | 'reminder'

interface ParsedElementChipProps {
    type: ElementType
    value: string
    onRemove?: () => void
    onClick?: () => void
    className?: string
}

const elementConfig: Record<ElementType, { icon: string; color: string; label: string }> = {
    date: {
        icon: '📅',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        label: 'Date',
    },
    project: {
        icon: '📁',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        label: 'Project',
    },
    tag: {
        icon: '🏷️',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        label: 'Tag',
    },
    priority: {
        icon: '⚡',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        label: 'Priority',
    },
    reminder: {
        icon: '🔔',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        label: 'Reminder',
    },
}

export function ParsedElementChip({
    type,
    value,
    onRemove,
    onClick,
    className,
}: ParsedElementChipProps) {
    const config = elementConfig[type]

    return (
        <Badge
            variant="secondary"
            className={cn(
                'gap-1.5 pr-1 text-xs font-medium transition-all',
                config.color,
                onClick && 'cursor-pointer hover:opacity-80',
                className
            )}
            onClick={onClick}
        >
            <span className="text-sm">{config.icon}</span>
            <span>{value}</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {config.label}</span>
                </button>
            )}
        </Badge>
    )
}
