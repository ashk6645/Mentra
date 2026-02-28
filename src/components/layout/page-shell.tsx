import { cn } from "@/lib/utils"

interface PageShellProps {
    children: React.ReactNode
    className?: string
}

export function PageShell({ children, className }: PageShellProps) {
    return (
        <div className="flex-1 overflow-y-auto min-h-full no-scrollbar">
            <div className={cn(
                "max-w-4xl mx-auto px-4 sm:px-6 pb-20 pt-16 md:pt-20",
                className
            )}>
                {children}
            </div>
        </div>
    )
}
