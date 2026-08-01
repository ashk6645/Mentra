'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { R, T, INK, FOCUS } from '@/lib/second-brain/ui'

/**
 * Second Brain section navigation.
 *
 * Horizontal rather than a second sidebar: the app already has one, and spec §4
 * warns against a giant overwhelming nav. Sections Mentra already owns (Tasks,
 * Projects, Calendar) are not repeated here — they live in the main sidebar, and
 * duplicating them would imply they were different things.
 *
 * The primary/overflow split is deliberate. At eleven flat items the bar scrolled
 * horizontally on a phone and every destination looked equally important, which is
 * exactly the failure §4 describes. What you open daily stays visible; what you
 * open weekly or monthly moves behind "More".
 */
const PRIMARY = [
    { href: '/second-brain', label: 'Home' },
    { href: '/second-brain/today', label: 'Today' },
    { href: '/second-brain/habits', label: 'Habits' },
    { href: '/second-brain/routines', label: 'Routines' },
    { href: '/second-brain/fitness', label: 'Fitness' },
    { href: '/second-brain/learning', label: 'Learning' },
    { href: '/second-brain/goals', label: 'Goals' },
]

const OVERFLOW = [
    { href: '/second-brain/library', label: 'Library' },
    { href: '/second-brain/areas', label: 'Areas' },
    { href: '/second-brain/reflect', label: 'Reflect' },
    { href: '/second-brain/analytics', label: 'Analytics' },
    { href: '/second-brain/finance', label: 'Finance' },
    { href: '/second-brain/archive', label: 'Archive' },
    { href: '/second-brain/settings', label: 'Settings' },
]

/** Exact match for Home, prefix elsewhere — otherwise Home stays lit everywhere. */
const isActive = (pathname: string, href: string) =>
    href === '/second-brain' ? pathname === '/second-brain' : pathname.startsWith(href)

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'relative shrink-0 px-2.5 py-1.5', R.md, T.button, FOCUS,
                'transition-colors',
                active ? INK.strong : cn(INK.muted, 'hover:text-foreground')
            )}
        >
            {active && (
                <motion.span
                    layoutId="sb-nav-active"
                    transition={{ type: 'spring', stiffness: 480, damping: 38, mass: 0.6 }}
                    className="absolute inset-0 rounded-[8px] bg-foreground/[0.06]"
                />
            )}
            <span className="relative z-10">{label}</span>
        </Link>
    )
}

export function SecondBrainNav() {
    const pathname = usePathname()
    const overflowActive = OVERFLOW.find(section => isActive(pathname, section.href))

    return (
        <nav
            aria-label="Second Brain sections"
            className="-mx-1 flex items-center gap-0.5 overflow-x-auto px-1 pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {PRIMARY.map(section => (
                <NavLink
                    key={section.href}
                    href={section.href}
                    label={section.label}
                    active={isActive(pathname, section.href)}
                />
            ))}

            <DropdownMenu>
                <DropdownMenuTrigger
                    className={cn(
                        'flex shrink-0 items-center gap-1.5 px-2.5 py-1.5', R.md, T.button, FOCUS,
                        'transition-colors',
                        overflowActive ? INK.strong : cn(INK.muted, 'hover:text-foreground')
                    )}
                >
                    {/* Naming the active overflow section keeps the current location
                        visible rather than hiding it behind a generic label. */}
                    {overflowActive ? overflowActive.label : 'More'}
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="min-w-[170px]">
                    {OVERFLOW.map(section => (
                        <DropdownMenuItem key={section.href} asChild>
                            <Link
                                href={section.href}
                                className={cn(
                                    'w-full cursor-pointer', T.body,
                                    isActive(pathname, section.href) ? INK.strong : INK.default
                                )}
                            >
                                {section.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    )
}
