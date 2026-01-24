'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/use-ui-store'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CommandPaletteWrapperProps {
    user: any
    children: React.ReactNode
}

export function CommandPaletteWrapper({ user, children }: CommandPaletteWrapperProps) {
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
            <CommandPalette />
            <Sidebar user={user} onOpenCommand={handleOpenCommand} />

            {!mounted ? (
                <main className="md:pl-64 min-h-screen">
                    <div className="h-full pt-16 md:pt-0 relative" style={{ paddingLeft: isSidebarCollapsed ? 80 : 256 }}>
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
                    <div className="h-full pt-16 md:pt-0 relative">
                        {children}
                    </div>
                </motion.main>
            )}
        </>
    )
}


