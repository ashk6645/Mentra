export default function TodayLoading() {
    return (
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 w-48 bg-muted rounded" />
                    <div className="h-6 w-64 bg-muted rounded" />
                </div>
                <div className="mt-8 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-card rounded-lg border animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    )
}
