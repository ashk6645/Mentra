import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex-1 h-full flex flex-col animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="px-8 py-6 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-24" />
            </div>

            {/* Toolbar Skeleton */}
            <div className="border-b border-border/30 bg-muted/20 px-6 py-2 flex items-center justify-between">
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-8 w-32" />
            </div>

            {/* Content Skeleton (Grid/Gallery) */}
            <div className="flex-1 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-xl border border-border/50 bg-card p-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="pt-4 mt-auto">
                                <Skeleton className="h-2 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
