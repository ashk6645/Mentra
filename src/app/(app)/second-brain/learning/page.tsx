import { LearningView } from '@/components/second-brain/learning-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Learning – Second Brain',
    description: 'Topics you are deliberately getting better at.',
}

export default function LearningPage() {
    return (
        <SecondBrainPage
            title="Learning"
            description="Topics you are deliberately getting better at."
        >
            <LearningView />
        </SecondBrainPage>
    )
}
