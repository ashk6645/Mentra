'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/use-ui-store'


interface CommandPaletteWrapperProps {
    user: any

    children: React.ReactNode
    initialPages?: any[]
}

export function CommandPaletteWrapper({ user, children, initialPages }: CommandPaletteWrapperProps) {
    const { isSidebarCollapsed } = useUIStore()


    const handleOpenCommand = () => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette?.()
        }
    }

    return (
        <>
            <CommandPalette />
            <Sidebar user={user} onOpenCommand={handleOpenCommand} initialPages={initialPages} />

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


