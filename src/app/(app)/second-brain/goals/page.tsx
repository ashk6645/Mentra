import { Suspense } from 'react'
import { GoalsView } from '@/components/second-brain/goals-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Goals – Second Brain',
    description: 'Outcomes worth working toward, measured against the time they have left.',
}

export default function GoalsPage() {
    return (
        <SecondBrainPage>
            {/* The view reads `?goal=` to open one directly, which needs a Suspense
                boundary so the rest of the page can still render on the server. */}
            <Suspense>
                <GoalsView />
            </Suspense>
        </SecondBrainPage>
    )
}
