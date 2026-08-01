import { AnalyticsView } from '@/components/second-brain/analytics-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Analytics – Second Brain',
    description: 'Four questions about how the last few weeks actually went.',
}

export default function AnalyticsPage() {
    return (
        <SecondBrainPage
            title="Analytics"
            description="Four questions about how the last few weeks actually went."
        >
            <AnalyticsView />
        </SecondBrainPage>
    )
}
