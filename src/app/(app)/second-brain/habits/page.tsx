import { HabitsView } from '@/components/second-brain/habits-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Habits – Second Brain',
    description: 'Track what you repeat, by week and by month.',
}

export default function HabitsPage() {
    return (
        <SecondBrainPage>
            <HabitsView />
        </SecondBrainPage>
    )
}
