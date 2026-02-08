import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string
    description?: string | React.ReactNode
    icon?: React.ElementType
    actions?: React.ReactNode
    className?: string
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("relative mb-10", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm border bg-primary/10 text-primary border-border/30">
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
