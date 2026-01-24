'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/use-ui-store'


interface CommandPaletteWrapperProps {
    user: any
    projects?: any[]
    children: React.ReactNode
}

export function CommandPaletteWrapper({ user, projects, children }: CommandPaletteWrapperProps) {
    const { isSidebarCollapsed } = useUIStore()


    const handleOpenCommand = () => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette?.()
        }
    }

    return (
        <>
            <CommandPalette />
            <Sidebar user={user} projects={projects} onOpenCommand={handleOpenCommand} />

            <main
                className="min-h-screen transition-[padding] duration-300 ease-in-out"
                style={{
                    paddingLeft: isSidebarCollapsed ? 80 : 256
                }}
            >
                <div className="h-full pt-16 md:pt-0 relative">
                    {children}
                </div>
            </main>
        </>
    )
}


