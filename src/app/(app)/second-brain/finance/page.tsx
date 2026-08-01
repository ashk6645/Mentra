import { FinanceView } from '@/components/second-brain/finance-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Finance – Second Brain',
    description: 'Money in, money out, and where it actually went.',
}

export default function FinancePage() {
    return (
        <SecondBrainPage
            title="Finance"
            description="Money in, money out, and where it actually went."
        >
            <FinanceView />
        </SecondBrainPage>
    )
}
