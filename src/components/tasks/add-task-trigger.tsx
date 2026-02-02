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
                "relative group",
                "flex items-center gap-3",
                "px-4 py-3 mx-1", // Added mx-1 to align visually with rows that have borders
                "rounded-xl",
                "border-2 border-dashed border-border/20",
                "bg-muted/10", // Subtle background
                "transition-all duration-200 ease-out",
                "cursor-text", // Feels like an input

                // Hover state - becomes solid and lifts slightly
                "hover:border-solid",
                "hover:border-primary/20",
                "hover:bg-background",
                "hover:shadow-sm",
                "hover:-translate-y-0.5",

                className
            )}
        >
            {/* Plus icon */}
            <Plus className={cn(
                "h-5 w-5",
                "text-muted-foreground/40",
                "transition-colors duration-200",
                "group-hover:text-primary/70"
            )} />

            {/* Label acting as placeholder */}
            <span className={cn(
                "flex-1 font-medium text-[15px]",
                "text-muted-foreground/60",
                "transition-colors duration-200",
                "group-hover:text-foreground/80"
            )}>
                {label}
            </span>

            {/* Keyboard hint (only show on hover) */}
            <kbd className={cn(
                "hidden sm:inline-flex items-center justify-center",
                "px-2 py-1",
                "h-5 min-w-[20px]",
                "rounded-[4px]",
                "border border-border/30",
                "bg-muted/30",
                "text-[10px] font-mono font-medium text-muted-foreground/40",
                "opacity-0 group-hover:opacity-100",
                "transition-all duration-200",
                "translate-x-2 group-hover:translate-x-0" // Slide in effect
            )}>
                Q
            </kbd>
        </div>
    )
}
