import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string
    description?: string | React.ReactNode
    icon?: React.ElementType
    actions?: React.ReactNode
    className?: string
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
    // Page-specific styling for personality
    const getPageStyle = () => {
        if (title === 'Today') return {
            icon: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-orange-600 border-orange-200/30 dark:border-orange-800/30',
            glow: 'bg-gradient-to-b from-orange-50/20 via-transparent to-transparent dark:from-orange-950/10'
        }
        if (title === 'Inbox') return {
            icon: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/30 dark:border-blue-800/30',
            glow: 'bg-gradient-to-b from-blue-50/20 via-transparent to-transparent dark:from-blue-950/10'
        }
        if (title === 'Upcoming') return {
            icon: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200/30 dark:border-violet-800/30',
            glow: 'bg-gradient-to-b from-violet-50/20 via-transparent to-transparent dark:from-violet-950/10'
        }
        if (title === 'Completed') return {
            icon: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 text-emerald-600 border-emerald-200/30 dark:border-emerald-800/30',
            glow: 'bg-gradient-to-b from-emerald-50/20 via-transparent to-transparent dark:from-emerald-950/10'
        }
        if (title === 'Calendar') return {
            icon: 'bg-gradient-to-br from-indigo-500/10 to-blue-500/10 text-indigo-600 border-indigo-200/30 dark:border-indigo-800/30',
            glow: 'bg-gradient-to-b from-indigo-50/20 via-transparent to-transparent dark:from-indigo-950/10'
        }
        if (title === 'Focus') return {
            icon: 'bg-gradient-to-br from-rose-500/10 to-red-500/10 text-rose-600 border-rose-200/30 dark:border-rose-800/30',
            glow: 'bg-gradient-to-b from-rose-50/20 via-transparent to-transparent dark:from-rose-950/10'
        }
        // Default styling
        return {
            icon: 'bg-primary/10 text-primary border-border/30',
            glow: ''
        }
    }

    const style = getPageStyle()

    return (
        <div className={cn("relative mb-10", className)}>
            {/* Subtle page-specific glow */}
            {style.glow && (
                <div className={cn("absolute -inset-x-4 -top-6 h-32 -z-10 rounded-t-3xl", style.glow)} />
            )}
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "flex items-center justify-center w-11 h-11 rounded-xl shadow-sm border",
                            style.icon
                        )}>
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                        )}
                    </div>
                </div>
                
                {actions}
            </div>
        </div>
    )
}
