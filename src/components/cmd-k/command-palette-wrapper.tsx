'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/use-ui-store'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'


interface CommandPaletteWrapperProps {
    user: any
    children: React.ReactNode
    initialProjects?: any[]
    sidebarCounts?: { inbox: number, today: number, overdue: number }
}

export function CommandPaletteWrapper({ user, children, initialProjects, sidebarCounts }: CommandPaletteWrapperProps) {
    const { isSidebarCollapsed } = useUIStore()
    const { isOpen: isTaskPanelOpen } = useTaskDetailStore()

    // Track whether we're on a small screen (below md = 768px).
    // On small screens the sidebar is a Sheet overlay — it takes no layout space.
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

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
                initialProjects={initialProjects}
                counts={sidebarCounts}
            />

            <motion.main
                className="min-h-screen"
                initial={false}
                animate={{
                    paddingLeft: (isMobile || isSidebarCollapsed) ? 0 : 220,
                    paddingRight: (!isMobile && isTaskPanelOpen) ? 520 : 0,
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


