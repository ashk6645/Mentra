import { SecondBrainView } from '@/components/second-brain/second-brain-view'

export const metadata = {
    title: 'Second Brain – Mentra',
    description: 'Daily routine and habit tracker',
}

/**
 * Second Brain — a self-contained routine tracker.
 *
 * Intentionally independent of the task system: it has its own data shapes, its own
 * storage, and shares nothing with `Task`. State lives in the browser while the shape
 * of the feature is still being worked out, so nothing here needs a migration to try.
 */
export default function SecondBrainPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="w-full">
                <div className="max-w-5xl mx-auto px-6 pt-12 pb-6">
                    <h1 className="text-[32px] font-bold tracking-tight leading-tight text-foreground">
                        Second Brain
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your habits and daily routine.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 pb-16">
                    <SecondBrainView />
                </div>
            </div>
        </div>
    )
}
