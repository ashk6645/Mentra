'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FOCUS } from '@/lib/second-brain/ui'

export interface SegmentOption<T extends string> {
    id: T
    label: string
    icon?: React.ComponentType<{ className?: string }>
}

interface SegmentedProps<T extends string> {
    options: SegmentOption<T>[]
    value: T
    onChange: (value: T) => void
    ariaLabel: string
}

/**
 * Segmented control with a single indicator that slides between options.
 *
 * The sliding pill is one shared element positioned by Framer's `layoutId`, not a
 * per-option background that fades. That distinction is the whole effect: the
 * selection travels, which is what makes an Apple/Linear segmented control feel
 * physical rather than like three buttons taking turns being highlighted.
 */
export function Segmented<T extends string>({
    options,
    value,
    onChange,
    ariaLabel,
}: SegmentedProps<T>) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className="relative inline-flex items-center gap-0.5 rounded-[8px] bg-black/[0.04] p-[3px] dark:bg-white/[0.05]"
        >
            {options.map(({ id, label, icon: Icon }) => {
                const selected = value === id

                return (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(id)}
                        className={cn(
                            'relative flex items-center gap-1.5 rounded-[8px] px-2.5 py-[5px]',
                            'text-[13px] font-medium transition-colors duration-150',
                            FOCUS,
                            selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {selected && (
                            <motion.span
                                layoutId="sb-segment-indicator"
                                transition={{ type: 'spring', stiffness: 480, damping: 38, mass: 0.6 }}
                                className={cn(
                                    'absolute inset-0 rounded-[8px] bg-white dark:bg-white/[0.10]',
                                    'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)]',
                                    'dark:shadow-none'
                                )}
                            />
                        )}

                        {/* Above the indicator, which is absolutely positioned behind. */}
                        <span className="relative z-10 flex items-center gap-1.5">
                            {Icon && <Icon className="h-3.5 w-3.5" />}
                            {label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
