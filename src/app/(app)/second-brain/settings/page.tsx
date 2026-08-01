import { SettingsView } from '@/components/second-brain/settings-view'
import { SecondBrainPage } from '@/components/second-brain/page-shell'

export const metadata = {
    title: 'Settings – Second Brain',
    description: 'Where your data lives, and how to get it out.',
}

export default function SettingsPage() {
    return (
        <SecondBrainPage
            title="Settings"
            description="Where your data lives, and how to get it out."
        >
            <SettingsView />
        </SecondBrainPage>
    )
}
