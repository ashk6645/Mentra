import { FitnessView } from '@/components/second-brain/fitness-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Fitness – Second Brain',
    description: 'Training sessions, set logging and exercise progression.',
}

export default function FitnessPage() {
    return (
        <SecondBrainPage
            title="Fitness"
            description="Log a session, then watch the numbers move."
        >
            <FitnessView />
        </SecondBrainPage>
    )
}
