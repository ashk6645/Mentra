import { AreasView } from '@/components/second-brain/areas-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Areas – Second Brain',
    description: 'Ongoing responsibilities and the standard you hold in each.',
}

export default function AreasPage() {
    return (
        <SecondBrainPage
            title="Areas"
            description="The parts of life you maintain. No finish line — just a standard."
        >
            <AreasView />
        </SecondBrainPage>
    )
}
