import { SidebarLoader } from '@/components/layout/sidebar-loader'
import { SidebarSkeleton } from '@/components/layout/sidebar-skeleton'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommandPaletteWrapper } from '@/components/cmd-k/command-palette-wrapper'
import { GlobalQuickAdd } from '@/components/tasks/global-quick-add'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Projects are now fetched inside SidebarLoader (streaming)
    const sidebar = (
        <Suspense fallback={<SidebarSkeleton />}>
            <SidebarLoader user={user} />
        </Suspense>
    )

    return (
        <div className="min-h-screen bg-background">
            <CommandPaletteWrapper sidebar={sidebar}>
                {children}
            </CommandPaletteWrapper>
            <GlobalQuickAdd />
        </div>
    )
}

