import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/actions/projects'
import { getPages } from '@/lib/actions/pages'

import { CommandPalette } from '@/components/cmd-k/command-palette'
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

    const [projects, pagesResult] = await Promise.all([
        getProjects(),
        getPages(),
    ])

    const pages = pagesResult.success ? pagesResult.pages : []

    return (
        <div className="min-h-screen bg-background">
            <CommandPaletteWrapper projects={projects} pages={pages} user={user}>
                {children}
            </CommandPaletteWrapper>
            <GlobalQuickAdd />
        </div>
    )
}

