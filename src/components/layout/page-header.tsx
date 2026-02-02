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
            iconBg: 'bg-gradient-to-br from-orange-400/10 to-amber-400/10 border-orange-200/40 dark:border-orange-800/40',
            iconColor: 'text-orange-500',
            pageBg: 'bg-gradient-to-b from-orange-50/30 to-transparent dark:from-orange-950/10'
        }
        if (title === 'Inbox') return {
            iconBg: 'bg-gradient-to-br from-blue-400/10 to-cyan-400/10 border-blue-200/40 dark:border-blue-800/40',
            iconColor: 'text-blue-500',
            pageBg: 'bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/10'
        }
        if (title === 'Upcoming') return {
            iconBg: 'bg-gradient-to-br from-purple-400/10 to-pink-400/10 border-purple-200/40 dark:border-purple-800/40',
            iconColor: 'text-purple-500',
            pageBg: 'bg-gradient-to-b from-purple-50/30 to-transparent dark:from-purple-950/10'
        }
        if (title === 'Completed') return {
            iconBg: 'bg-gradient-to-br from-green-400/10 to-emerald-400/10 border-green-200/40 dark:border-green-800/40',
            iconColor: 'text-green-500',
            pageBg: 'bg-gradient-to-b from-green-50/30 to-transparent dark:from-green-950/10'
        }
        if (title === 'Calendar') return {
            iconBg: 'bg-gradient-to-br from-indigo-400/10 to-blue-400/10 border-indigo-200/40 dark:border-indigo-800/40',
            iconColor: 'text-indigo-500',
            pageBg: 'bg-gradient-to-b from-indigo-50/30 to-transparent dark:from-indigo-950/10'
        }
        if (title === 'Focus') return {
            iconBg: 'bg-gradient-to-br from-rose-400/10 to-red-400/10 border-rose-200/40 dark:border-rose-800/40',
            iconColor: 'text-rose-500',
            pageBg: 'bg-gradient-to-b from-rose-50/30 to-transparent dark:from-rose-950/10'
        }
        // Default styling
        return {
            iconBg: 'bg-primary/10 border-border/40',
            iconColor: 'text-primary',
            pageBg: ''
        }
    }

    const style = getPageStyle()

    return (
        <div className={cn("relative", className)}>
            {/* Subtle page background gradient */}
            <div className={cn("absolute inset-0 -top-6 -z-10 h-32 rounded-t-3xl", style.pageBg)} />
            
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-xl",
                            "shadow-sm border",
                            style.iconBg
                        )}>
                            <Icon className={cn("w-6 h-6", style.iconColor)} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    )
}
