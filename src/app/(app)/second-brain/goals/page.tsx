import { GoalsView } from '@/components/second-brain/goals-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Goals – Second Brain',
    description: 'Outcomes with a finish line, measured against pace.',
}

export default function GoalsPage() {
    return (
        <SecondBrainPage
            title="Goals"
            description="Outcomes, not activities — each one measured against the time it has left."
        >
            <GoalsView />
        </SecondBrainPage>
    )
}
