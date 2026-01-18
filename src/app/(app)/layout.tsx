import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/actions/projects'

import { CommandPalette } from '@/components/cmd-k/command-palette'
import { CommandPaletteWrapper } from '@/components/cmd-k/command-palette-wrapper'

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

    const projects = await getProjects()

    return (
        <div className="min-h-screen bg-background">
            <CommandPaletteWrapper projects={projects} user={user}>
                <main className="md:pl-64 min-h-screen transition-all duration-300 ease-in-out">
                    {/* Adds padding-top on mobile for the burger menu to not overlap content */}
                    <div className="h-full pt-16 md:pt-0 relative">
                        {children}
                    </div>
                </main>
            </CommandPaletteWrapper>
        </div>
    )
}
