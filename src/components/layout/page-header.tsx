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
        <div className={cn("relative mb-8", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm border bg-primary/10 text-primary border-border/20">
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-[32px] font-bold tracking-tight leading-tight">{title}</h1>
                        {description && (
                            <p className="text-[15px] text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                </div>

                {actions}
            </div>
        </div>
    )
}
