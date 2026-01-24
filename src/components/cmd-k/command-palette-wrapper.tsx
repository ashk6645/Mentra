'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { Project } from '@prisma/client'
import { useUIStore } from '@/stores/use-ui-store'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PageItem {
    id: string
    title: string
    icon: string | null
    parentPageId: string | null
    isFavorited: boolean
}

interface CommandPaletteWrapperProps {
    projects: Project[]
    pages?: PageItem[]
    user: any
    children: React.ReactNode
}

export function CommandPaletteWrapper({ projects, pages = [], user, children }: CommandPaletteWrapperProps) {
    const { isSidebarCollapsed } = useUIStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleOpenCommand = () => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette?.()
        }
    }

    return (
        <>
            <CommandPalette projects={projects} />
            <Sidebar projects={projects} pages={pages} user={user} onOpenCommand={handleOpenCommand} />

            {!mounted ? (
                <main className="md:pl-64 min-h-screen">
                    {/* Fixed padding to match the motion variant initial state */}
                    <div className="h-full pt-16 md:pt-0 relative animate-in-fade" style={{ paddingLeft: isSidebarCollapsed ? 80 : 256 }}>
                        {children}
                    </div>
                </main>
            ) : (
                <motion.main
                    className="min-h-screen"
                    initial={false}
                    animate={{
                        paddingLeft: isSidebarCollapsed ? 80 : 256
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {/* Adds padding-top on mobile for the burger menu to not overlap content */}
                    <div className="h-full pt-16 md:pt-0 relative animate-in-fade">
                        {children}
                    </div>
                </motion.main>
            )}
        </>
    )
}


