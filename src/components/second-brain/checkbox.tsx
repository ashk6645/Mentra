'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { POP } from '@/lib/second-brain/ui'

/**
 * The completion checkbox.
 *
 * Two details do the work:
 *
 * 1. The box pops to ~1.12 and settles, so ticking something feels like a
 *    physical action rather than a state change.
 * 2. The tick is a stroked path animated with `pathLength`, so it *draws*
 *    rather than appearing.
 *
 * Presentational only — the parent owns the button semantics. The parent should
 * carry `group` so hovering the whole row firms up the empty box.
 */
export const Checkbox = memo(function Checkbox({
    checked,
    size = 'md',
    className,
}: {
    checked: boolean
    size?: 'sm' | 'md'
    className?: string
}) {
    return (
        <motion.span
            aria-hidden
            initial={false}
            animate={{ scale: checked ? [1, 1.12, 1] : 1 }}
            transition={POP}
            className={cn(
                'relative flex shrink-0 items-center justify-center border',
                'transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                size === 'sm' ? 'h-4 w-4 rounded-[5px]' : 'h-[18px] w-[18px] rounded-[6px]',
                checked
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-black/[0.2] bg-transparent group-hover:border-black/[0.38] dark:border-white/[0.22] dark:group-hover:border-white/[0.4]',
                className
            )}
        >
            <svg viewBox="0 0 16 16" fill="none" className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-[11px] w-[11px]'}>
                <motion.path
                    d="M3.2 8.4L6.3 11.4L12.8 4.9"
                    stroke="white"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
                    transition={{
                        pathLength: { duration: 0.22, ease: [0.65, 0, 0.35, 1], delay: checked ? 0.04 : 0 },
                        opacity: { duration: 0.1 },
                    }}
                />
            </svg>
        </motion.span>
    )
})
