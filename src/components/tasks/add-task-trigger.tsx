'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddTaskTriggerProps {
    onClick?: () => void
    variant?: 'inline' | 'compact'
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

    // Default 'inline' variant - Ghost Card Style
    return (
        <div
            onClick={onClick}
            suppressHydrationWarning={true}
            className={cn(
                // Ghost Card - matches task card width and alignment
                "flex items-center gap-3.5 px-4 py-3.5 rounded-[14px]",
                "cursor-pointer transition-all duration-200 ease-out",
                
                // Default: Nearly invisible, subtle hint
                "bg-transparent hover:bg-card/40 dark:hover:bg-card/20",
                "border border-dashed border-transparent hover:border-border/30",
                
                // Hover: Slight elevation like task cards
                "hover:shadow-sm hover:shadow-black/5 dark:hover:shadow-black/20",
                
                "text-muted-foreground/50 hover:text-muted-foreground",
                "group",
                className
            )}
        >
            <div className="h-5 w-5 rounded-md border-2 border-muted-foreground/20 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                <Plus className="h-3 w-3 group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium text-[15px]">{label}</span>
        </div>
    )
}
