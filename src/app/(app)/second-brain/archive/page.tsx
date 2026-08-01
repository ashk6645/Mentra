import { ArchiveView } from '@/components/second-brain/archive-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Archive – Second Brain',
    description: 'Everything you put away, still restorable.',
}

export default function ArchivePage() {
    return (
        <SecondBrainPage
            title="Archive"
            description="Everything you put away, still restorable."
        >
            <ArchiveView />
        </SecondBrainPage>
    )
}
