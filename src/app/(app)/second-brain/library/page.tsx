import { LibraryView } from '@/components/second-brain/library-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Library – Second Brain',
    description: 'Resources, books and the ideas you have not committed to yet.',
}

export default function LibraryPage() {
    return (
        <SecondBrainPage
            title="Library"
            description="Resources, books and the ideas you have not committed to yet."
        >
            <LibraryView />
        </SecondBrainPage>
    )
}
