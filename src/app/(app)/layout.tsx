import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommandPaletteWrapper } from '@/components/cmd-k/command-palette-wrapper'
import { GlobalQuickAdd } from '@/components/tasks/global-quick-add'
import { getCurrentUser } from '@/lib/user-session'
import { getProjects } from '@/lib/actions/projects'
import { getSidebarCounts } from '@/lib/actions/tasks'
import { TaskDetailPanel } from '@/components/task-detail/task-detail-panel'
import { BulkActionsBar } from '@/components/tasks/bulk-actions-bar'
import { KeyboardShortcuts } from '@/components/utils/keyboard-shortcuts'
import { BackgroundPattern } from '@/components/layout/background-pattern'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }


    const projectsResult = await getProjects()
    const { data: sidebarCounts } = await getSidebarCounts()

    return (
        <div className="min-h-screen bg-background relative">
            <BackgroundPattern />
            <div className="relative z-10">
                <CommandPaletteWrapper
                    user={user}
                    initialProjects={projectsResult.success ? projectsResult.data : []}
                    sidebarCounts={sidebarCounts || { inbox: 0, today: 0, overdue: 0 }}
                >
                    {children}
                </CommandPaletteWrapper>
                <GlobalQuickAdd />
                <TaskDetailPanel />
                <BulkActionsBar />
                <KeyboardShortcuts />
            </div>
        </div>
    )
}


