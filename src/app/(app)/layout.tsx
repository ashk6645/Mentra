import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommandPaletteWrapper } from '@/components/cmd-k/command-palette-wrapper'
import { GlobalQuickAdd } from '@/components/tasks/global-quick-add'
import { getProjects } from '@/lib/actions/projects'

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

    const projects = await getProjects(user.id)

    // Remove data fetching from layout - let components fetch their own data
    return (
        <div className="min-h-screen bg-background">
            <CommandPaletteWrapper user={user} projects={projects}>
                {children}
            </CommandPaletteWrapper>
            <GlobalQuickAdd />
        </div>
    )
}

