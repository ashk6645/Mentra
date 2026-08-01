import { ReflectView } from '@/components/second-brain/reflect-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Reflect – Second Brain',
    description: 'Journal, and the weekly and monthly reviews that sit on top of it.',
}

export default function ReflectPage() {
    return (
        <SecondBrainPage
            title="Reflect"
            description="Journal, and the weekly and monthly reviews that sit on top of it."
        >
            <ReflectView />
        </SecondBrainPage>
    )
}
