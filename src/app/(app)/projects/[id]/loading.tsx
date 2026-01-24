import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex-1 h-full flex flex-col animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="px-8 py-6 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-64" />
                        </div>
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton (Board Tasks) */}
            <div className="flex-1 px-4 py-6 overflow-hidden">
                <div className="flex gap-4 w-full h-full overflow-x-auto pb-4">
                    {/* Columns */}
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-none w-[350px] flex flex-col h-full rounded-xl bg-muted/30 border border-border/40">
                            {/* Column Header */}
                            <div className="p-3 flex items-center justify-between border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-5 w-6 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-6" />
                            </div>
                            {/* Cards */}
                            <div className="p-2 space-y-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="p-4 rounded-lg border border-border/60 bg-card space-y-3">
                                        <div className="flex items-start justify-between">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-4" />
                                        </div>
                                        <Skeleton className="h-3 w-full" />
                                        <div className="flex gap-2 pt-2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
