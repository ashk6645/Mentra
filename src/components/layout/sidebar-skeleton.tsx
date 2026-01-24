
export function SidebarSkeleton() {
    return (
        <div className="hidden md:block fixed inset-y-0 z-50 w-[220px] bg-sidebar border-r border-sidebar-border h-full">
            <div className="px-4 py-6 flex flex-col gap-4">
                {/* User Profile Skeleton */}
                <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />

                {/* Nav Skeleton */}
                <div className="space-y-2 mt-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 w-full rounded-md bg-muted/10 animate-pulse" />
                    ))}
                </div>

                {/* Projects Skeleton */}
                <div className="mt-8">
                    <div className="h-4 w-16 bg-muted/20 animate-pulse mb-4" />
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-6 w-full rounded-md bg-muted/10 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
