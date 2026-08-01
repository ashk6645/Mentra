import { RoutinesView } from '@/components/second-brain/routines-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Routines – Second Brain',
    description: 'Ordered sequences you run on a schedule.',
}

export default function RoutinesPage() {
    return (
        <SecondBrainPage
            title="Routines"
            description="Ordered sequences — a routine is a script, not a checkbox."
        >
            <RoutinesView />
        </SecondBrainPage>
    )
}
