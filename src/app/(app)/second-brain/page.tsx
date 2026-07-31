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
        <div className="flex h-full flex-col">
            <header className="w-full">
                <div className="mx-auto max-w-5xl px-8 pb-7 pt-14">
                    {/*
                      * Tighter tracking and a slightly smaller, less heavy weight than the
                      * other pages. At 32px/700 the title shouts; display type in this
                      * class of interface sits around 28px with negative tracking, which
                      * reads as deliberate rather than defaulted.
                      */}
                    <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
                        Second Brain
                    </h1>
                    <p className="mt-2 text-[14px] leading-[1.5] text-muted-foreground">
                        Track your habits and daily routine.
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-5xl px-8 pb-20">
                    <SecondBrainView />
                </div>
            </div>
        </div>
    )
}
