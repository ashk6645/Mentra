'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { POP } from '@/lib/second-brain/ui'

interface SBCheckboxProps {
    checked: boolean
    size?: 'sm' | 'md'
    className?: string
}

/**
 * The completion checkbox.
 *
 * Two details do the work here:
 *
 * 1. The box springs to ~1.12 and settles, so ticking something feels like a
 *    physical action rather than a state change. The design system asks for this
 *    bounce; the first pass used a CSS colour transition and felt inert.
 *
 * 2. The tick is a stroked path animated with `pathLength`, so it *draws* rather
 *    than popping in. It is the single cheapest thing that reads as "considered".
 *
 * Presentational only — the parent owns the button semantics, so this never
 * traps focus or duplicates a role.
 */
export const SBCheckbox = memo(function SBCheckbox({
    checked,
    size = 'md',
    className,
}: SBCheckboxProps) {
    const box = size === 'sm' ? 'h-[17px] w-[17px]' : 'h-[19px] w-[19px]'

    return (
        <motion.span
            aria-hidden
            // Tween, not spring: Framer only supports two keyframes with a spring,
            // and a 3-stop bounce throws `spring-two-frames` at runtime. The
            // back-out easing gives the same overshoot without the error.
            animate={{ scale: checked ? [1, 1.14, 1] : 1 }}
            transition={POP}
            className={cn(
                'relative flex shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-200',
                box,
                checked
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-black/[0.18] bg-transparent dark:border-white/[0.22]',
                className
            )}
        >
            <svg
                viewBox="0 0 16 16"
                fill="none"
                className={cn(size === 'sm' ? 'h-[10px] w-[10px]' : 'h-[11px] w-[11px]')}
            >
                <motion.path
                    d="M3.2 8.4L6.3 11.4L12.8 4.9"
                    stroke="white"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
                    transition={{
                        pathLength: { duration: 0.2, ease: [0.65, 0, 0.35, 1] },
                        opacity: { duration: 0.1 },
                    }}
                />
            </svg>
        </motion.span>
    )
})
