export default function DashboardLoading() {
    return (
        <div className="flex-1 p-6 md:p-8 pt-6 max-w-[1600px] mx-auto space-y-8">
            <div className="animate-pulse space-y-4">
                <div className="h-10 w-64 bg-muted rounded" />
                <div className="h-6 w-96 bg-muted rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-card rounded-lg border animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-[400px] bg-card rounded-lg border animate-pulse" />
                        <div className="h-[400px] bg-card rounded-lg border animate-pulse" />
                    </div>
                </div>
                <div className="md:col-span-4 lg:col-span-3 space-y-6">
                    <div className="h-48 bg-card rounded-lg border animate-pulse" />
                    <div className="h-64 bg-card rounded-lg border animate-pulse" />
                </div>
            </div>
        </div>
    )
}
