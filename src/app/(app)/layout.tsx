import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommandPaletteWrapper } from '@/components/cmd-k/command-palette-wrapper'
import { GlobalQuickAdd } from '@/components/tasks/global-quick-add'
import { getCurrentUser } from '@/lib/user-session'
import { getPages } from '@/lib/actions/pages'


export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const { pages } = await getPages()


    return (
        <div className="min-h-screen bg-background">
            <CommandPaletteWrapper user={user} initialPages={pages || []}>
                {children}
            </CommandPaletteWrapper>
            <GlobalQuickAdd />
        </div>
    )
}

