'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FOCUS, GLIDE, INK, T, TRANSITION } from '@/lib/second-brain/ui'

const SECTIONS = [
    { href: '/second-brain', label: 'Overview' },
    { href: '/second-brain/habits', label: 'Habits' },
    { href: '/second-brain/routines', label: 'Routines' },
    { href: '/second-brain/goals', label: 'Goals' },
]

/** Exact match for Overview, prefix elsewhere — otherwise Overview stays lit everywhere. */
const isActive = (pathname: string, href: string) =>
    href === '/second-brain' ? pathname === href : pathname.startsWith(href)

/**
 * Section tabs.
 *
 * Two indicators, each a single shared element that glides rather than a
 * background per tab that fades:
 *
 * - a soft pill that follows the pointer from tab to tab, so moving along the
 *   bar feels continuous instead of flickering on and off;
 * - a 2px rule under the current section, sitting on the header's own bottom
 *   border so the active tab reads as part of the page beneath it.
 */
export function SecondBrainNav() {
    const pathname = usePathname()
    const [hovered, setHovered] = useState<string | null>(null)

    return (
        <nav aria-label="Second Brain" className="-mx-2.5 -mb-px flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center" onMouseLeave={() => setHovered(null)}>
                {SECTIONS.map(section => {
                    const active = isActive(pathname, section.href)

                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            aria-current={active ? 'page' : undefined}
                            onMouseEnter={() => setHovered(section.href)}
                            onFocus={() => setHovered(section.href)}
                            onBlur={() => setHovered(null)}
                            className={cn('relative flex h-11 shrink-0 items-center px-2.5 rounded-[8px]', FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0')}
                        >
                            {hovered === section.href && (
                                <motion.span
                                    layoutId="sb-nav-hover"
                                    transition={GLIDE}
                                    className="absolute inset-x-0 inset-y-[7px] rounded-[7px] bg-black/[0.045] dark:bg-white/[0.06]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}

                            <span
                                className={cn(
                                    'relative z-10 px-0.5', T.button, 'text-[13.5px]', TRANSITION.fast,
                                    active ? INK.strong : cn(INK.muted, 'hover:text-foreground')
                                )}
                            >
                                {section.label}
                            </span>

                            {active && (
                                <motion.span
                                    layoutId="sb-nav-active"
                                    transition={GLIDE}
                                    className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-foreground"
                                />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
