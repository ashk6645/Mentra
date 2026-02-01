'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/use-ui-store'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { motion } from 'framer-motion'


interface CommandPaletteWrapperProps {
    user: any
    children: React.ReactNode
    initialPages?: any[]
    sidebarCounts?: { inbox: number, today: number, overdue: number }
}

export function CommandPaletteWrapper({ user, children, initialPages, sidebarCounts }: CommandPaletteWrapperProps) {
    const { isSidebarCollapsed } = useUIStore()
    const { isOpen: isTaskPanelOpen } = useTaskDetailStore()

    const handleOpenCommand = () => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette?.()
        }
    }

    return (
        <>
            <CommandPalette />
            <Sidebar
                user={user}
                onOpenCommand={handleOpenCommand}
                initialPages={initialPages}
                counts={sidebarCounts}
            />

            <motion.main
                className="min-h-screen"
                initial={false}
                animate={{
                    paddingLeft: isSidebarCollapsed ? 80 : 220,
                    paddingRight: isTaskPanelOpen ? 540 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="h-full pt-16 md:pt-0 relative">
                    {children}
                </div>
            </motion.main>
        </>
    )
}


