import { TodayView } from '@/components/second-brain/today-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Today – Second Brain',
    description: 'Your day: habits, routines and reflection.',
}

export default function SecondBrainTodayPage() {
    return (
        <SecondBrainPage>
            <TodayView />
        </SecondBrainPage>
    )
}
