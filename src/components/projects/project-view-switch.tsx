'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { List, Table2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOCUS, GLIDE, ICON, INK, T, TRANSITION } from '@/lib/second-brain/ui'

export type ProjectView = 'list' | 'table'

const VIEWS: { id: ProjectView; label: string; icon: LucideIcon }[] = [
    { id: 'list', label: 'List', icon: List },
    { id: 'table', label: 'Table', icon: Table2 },
]

/**
 * List / Table switch for a project.
 *
 * Links rather than buttons: the view lives in the URL (`?view=table`), so it
 * survives a reload, can be shared, and the server renders the right view first
 * time rather than flashing the list and swapping. `replace` keeps switching
 * views out of the back button's history.
 */
export function ProjectViewSwitch({ view }: { view: ProjectView }) {
    const pathname = usePathname()

    return (
        <nav
            aria-label="Project view"
            className="relative inline-flex items-center gap-0.5 rounded-[9px] bg-black/[0.045] p-[3px] dark:bg-white/[0.06]"
        >
            {VIEWS.map(({ id, label, icon: Icon }) => {
                const active = view === id
                return (
                    <Link
                        key={id}
                        href={id === 'list' ? pathname : `${pathname}?view=${id}`}
                        replace
                        scroll={false}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'relative flex h-[26px] items-center gap-1.5 rounded-[6px] px-2.5', T.button, 'text-[12.5px]',
                            TRANSITION.fast, FOCUS,
                            active ? INK.strong : cn(INK.muted, 'hover:text-foreground')
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId="project-view-indicator"
                                transition={GLIDE}
                                className="absolute inset-0 rounded-[6px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.05)] dark:bg-white/[0.12] dark:shadow-none"
                            />
                        )}
                        <Icon className={cn(ICON.md, 'relative z-10')} strokeWidth={2} />
                        <span className="relative z-10">{label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
