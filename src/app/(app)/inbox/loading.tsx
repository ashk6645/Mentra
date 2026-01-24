export default function InboxLoading() {
    return (
        <div className="flex-1 overflow-y-auto bg-muted/5 min-h-full">
            <div className="max-w-3xl mx-auto px-6 pb-20 pt-8">
                <div className="flex flex-col items-center justify-center py-8 space-y-2 animate-pulse">
                    <div className="h-8 w-32 bg-muted rounded" />
                    <div className="h-px w-24 bg-border/50 my-2" />
                    <div className="h-4 w-48 bg-muted rounded" />
                </div>
                <div className="mt-8 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-card rounded-lg border animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    )
}
