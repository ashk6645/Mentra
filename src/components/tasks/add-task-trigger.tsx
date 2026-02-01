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
        <div
            onClick={onClick}
            suppressHydrationWarning={true}
            className={cn(
                "flex-1 flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground group",
                className
            )}
        >
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                <Plus className="h-3 w-3 group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium">{label}</span>
        </div>
    )
}
