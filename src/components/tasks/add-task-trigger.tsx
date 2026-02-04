'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddTaskTriggerProps {
    onClick?: () => void
    variant?: 'inline' | 'compact' | 'ghost'
    className?: string
    label?: string
}

export function AddTaskTrigger({
    onClick,
    variant = 'inline',
    className,
    label = "Add task..."
}: AddTaskTriggerProps) {
    if (variant === 'compact') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2",
                    className
                )}
            >
                {label}
            </button>
        )
    }

    if (variant === 'ghost') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2",
                    className
                )}
            >
                <Plus className="h-4 w-4" />
                {label}
            </button>
        )
    }

    // Default 'inline' variant
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors w-full text-left",
                className
            )}
        >
            <Plus className="h-4 w-4" />
            <span>{label}</span>
        </button>
    )
}
