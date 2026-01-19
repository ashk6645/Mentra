'use client'

import { CommandPalette } from './command-palette'
import { Sidebar } from '@/components/layout/sidebar'
import { Project } from '@prisma/client'

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
    const handleOpenCommand = () => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette?.()
        }
    }

    return (
        <>
            <CommandPalette projects={projects} />
            <Sidebar projects={projects} pages={pages} user={user} onOpenCommand={handleOpenCommand} />
            {children}
        </>
    )
}

