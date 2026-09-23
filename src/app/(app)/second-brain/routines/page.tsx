import { RoutinesView } from '@/components/second-brain/routines-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Routines – Second Brain',
    description: 'Sequences you run without deciding.',
}

export default function RoutinesPage() {
    return (
        <SecondBrainPage>
            <RoutinesView />
        </SecondBrainPage>
    )
}
