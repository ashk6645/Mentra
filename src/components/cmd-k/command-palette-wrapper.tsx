'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { Project } from '@prisma/client'

interface CommandPaletteWrapperProps {
    projects: Project[]
    user: any
    children: React.ReactNode
}

export function CommandPaletteWrapper({ projects, user, children }: CommandPaletteWrapperProps) {
    const handleOpenCommand = () => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette?.()
        }
    }

    return (
        <>
            <CommandPalette projects={projects} />
            <Sidebar projects={projects} user={user} onOpenCommand={handleOpenCommand} />
            {children}
        </>
    )
}
