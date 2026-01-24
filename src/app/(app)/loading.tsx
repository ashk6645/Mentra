import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex-1 p-6 md:p-8 pt-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
            </div>

            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                        <Skeleton className="h-full rounded-xl" />
                        <Skeleton className="h-full rounded-xl" />
                    </div>
                </div>
                <div className="md:col-span-4 lg:col-span-3 space-y-6">
                    <Skeleton className="h-[300px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                </div>
            </div>
        </div>
    )
}
