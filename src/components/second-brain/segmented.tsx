'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FOCUS, GLIDE, INK, NUM, T, TRANSITION } from '@/lib/second-brain/ui'

export interface SegmentOption<T extends string> {
    id: T
    label: string
    /** A quiet count after the label. */
    count?: number
}

/**
 * Segmented control with one indicator that glides between options.
 *
 * The pill is a single shared element positioned by Framer's `layoutId`, not a
 * background per option that fades — the selection travels, which is what makes
 * it feel like a physical switch rather than buttons taking turns.
 *
 * The `layoutId` is unique per instance. Shared across instances, two controls on
 * one screen would fling a single pill from one to the other.
 */
export function Segmented<T extends string>({
    options,
    value,
    onChange,
    ariaLabel,
    fill,
}: {
    options: SegmentOption<T>[]
    value: T
    onChange: (value: T) => void
    ariaLabel: string
    /** Stretch to the container, options sharing the width equally. */
    fill?: boolean
}) {
    const indicator = useId()

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={cn(
                'relative items-center gap-0.5 rounded-[9px] bg-black/[0.045] p-[3px] dark:bg-white/[0.06]',
                fill ? 'flex w-full' : 'inline-flex'
            )}
        >
            {options.map(option => {
                const selected = value === option.id

                return (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            'relative flex h-[26px] items-center justify-center gap-1.5 rounded-[6px] px-2.5',
                            T.button, 'text-[12.5px]', TRANSITION.fast, FOCUS,
                            fill && 'flex-1',
                            selected ? INK.strong : cn(INK.muted, 'hover:text-foreground')
                        )}
                    >
                        {selected && (
                            <motion.span
                                layoutId={indicator}
                                transition={GLIDE}
                                className={cn(
                                    'absolute inset-0 rounded-[6px] bg-white dark:bg-white/[0.12]',
                                    'shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.05)] dark:shadow-none'
                                )}
                            />
                        )}
                        <span className="relative z-10">{option.label}</span>
                        {option.count !== undefined && (
                            <span className={cn('relative z-10', NUM, INK.subtle)}>{option.count}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
