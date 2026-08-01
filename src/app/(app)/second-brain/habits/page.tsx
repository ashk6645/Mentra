import { HabitsView } from '@/components/second-brain/habits-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Habits – Second Brain',
    description: 'Track habits by day, week and month.',
}

export default function HabitsPage() {
    return (
        <SecondBrainPage
            title="Habits"
            description="Day, week and month views of everything you repeat."
        >
            <HabitsView />
        </SecondBrainPage>
    )
}
