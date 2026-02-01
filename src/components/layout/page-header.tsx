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
        <div className={cn("flex flex-col gap-1 mb-10", className)}>
            <div className="flex items-end justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 rounded-xl bg-primary/5 text-primary">
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                </div>
                {actions && <div className="mb-1">{actions}</div>}
            </div>
            {description && (
                <div className={cn("text-base text-muted-foreground", Icon && "pl-14")}>
                    {description}
                </div>
            )}
        </div>
    )
}
