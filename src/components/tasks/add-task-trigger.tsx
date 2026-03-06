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
    label = "Add task"
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

    // Default 'inline' variant — minimal, Todoist-style trigger
    // Does NOT span full width. Stays compact and appears subtly.
    return (
        <button
            onClick={onClick}
            className={cn(
                "group/trigger inline-flex items-center gap-1.5 py-1.5 px-2 rounded-md text-sm",
                "text-muted-foreground/40 hover:text-muted-foreground",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                className
            )}
        >
            <span className="flex items-center justify-center w-4 h-4 rounded-full text-primary/60 group-hover/trigger:text-primary transition-colors duration-150">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-normal tracking-normal">{label}</span>
        </button>
    )
}
