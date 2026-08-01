'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './animated-number'
import { SURFACE, HAIRLINE, LABEL, NUM, T, INK, R, BAR_SPRING } from '@/lib/second-brain/ui'

/**
 * Shared building blocks for Second Brain pages (spec §58).
 *
 * These exist because they are each used by three or more screens — not on
 * principle. Anything used once stays local to the screen that uses it, per the
 * spec's warning against premature abstraction.
 */

// ─── Headings ────────────────────────────────────────────────────────────────

export function PageHeader({
    title,
    description,
    actions,
}: {
    title: string
    description?: string
    actions?: React.ReactNode
}) {
    return (
        <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
                <h1 className={cn(T.display, INK.strong)}>{title}</h1>
                {description && (
                    <p className={cn('mt-2', T.body, INK.muted)}>{description}</p>
                )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    )
}

export function SectionHeader({
    title,
    count,
    action,
}: {
    title: string
    count?: number
    action?: React.ReactNode
}) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
                <h2 className={LABEL}>{title}</h2>
                {count !== undefined && count > 0 && (
                    <span className={cn('text-[10px] font-medium', NUM, INK.subtle)}>{count}</span>
                )}
            </div>
            {action}
        </div>
    )
}

// ─── Progress ────────────────────────────────────────────────────────────────

/**
 * A progress bar.
 *
 * `complete` switches to the completion accent rather than the neutral fill —
 * the one place colour is allowed to appear, so finishing something reads
 * differently from merely being near the end.
 */
export const ProgressBar = memo(function ProgressBar({
    percent,
    complete,
    className,
}: {
    percent: number
    complete?: boolean
    className?: string
}) {
    return (
        <div
            className={cn('h-[3px] overflow-hidden rounded-full bg-foreground/[0.09]', className)}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <motion.div
                className={cn(
                    'h-full rounded-full',
                    complete ?? percent === 100 ? 'bg-emerald-500' : 'bg-foreground/55'
                )}
                initial={false}
                animate={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                transition={BAR_SPRING}
            />
        </div>
    )
})

/** Circular gauge. Reads faster than a bar at small sizes. */
export function Ring({
    percent,
    size = 36,
    stroke = 3,
    complete,
}: {
    percent: number
    size?: number
    stroke?: number
    complete?: boolean
}) {
    const radius = (size - stroke) / 2 - 1
    const circumference = 2 * Math.PI * radius
    const clamped = Math.min(100, Math.max(0, percent))

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={stroke}
                    className="stroke-foreground/[0.10]"
                />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={stroke} strokeLinecap="round"
                    className={cn(
                        complete ?? clamped === 100 ? 'stroke-emerald-500' : 'stroke-foreground/85'
                    )}
                    strokeDasharray={circumference}
                    initial={false}
                    animate={{ strokeDashoffset: circumference - (circumference * clamped) / 100 }}
                    transition={BAR_SPRING}
                />
            </svg>
        </div>
    )
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

/** One figure with a caption. The unit of every stat row in the app. */
export function Metric({
    value,
    label,
    suffix,
    animate = true,
    leading,
}: {
    value: number | string
    label: string
    suffix?: string
    /** Numbers roll to their new value; strings can't, so pass false. */
    animate?: boolean
    leading?: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            {leading}
            <div className="flex min-w-0 flex-col gap-1">
                <span className={cn('text-[19px] font-semibold leading-none tracking-[-0.02em]', NUM, INK.strong)}>
                    {typeof value === 'number' && animate ? (
                        <AnimatedNumber value={value} suffix={suffix ?? ''} />
                    ) : (
                        <>
                            {value}
                            {suffix}
                        </>
                    )}
                </span>
                <span className={cn('truncate text-[11px] leading-none', INK.muted)}>{label}</span>
            </div>
        </div>
    )
}

/** A row of metrics sharing one bordered surface. */
export function MetricRow({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 overflow-hidden sm:grid-cols-3',
                'divide-y sm:divide-x sm:divide-y-0',
                R.lg, SURFACE,
                `divide-black/[0.07] dark:divide-white/[0.07]`
            )}
        >
            {children}
        </div>
    )
}

// ─── Badges ──────────────────────────────────────────────────────────────────

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

/**
 * Colour is semantic, never decorative (spec §46). Five tones, fixed meanings:
 * success = done, warning = at risk, danger = overdue, info = in flight.
 */
const TONE: Record<Tone, string> = {
    neutral: 'bg-foreground/[0.06] text-muted-foreground',
    success: 'bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/[0.14] text-amber-700 dark:text-amber-400',
    danger: 'bg-red-500/[0.12] text-red-700 dark:text-red-400',
    info: 'bg-primary/[0.12] text-primary',
}

export function StatusBadge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-medium leading-none',
                R.sm,
                TONE[tone]
            )}
        >
            {children}
        </span>
    )
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

/**
 * A bordered panel.
 *
 * Used sparingly — spec §45 warns against wrapping everything in a card. Lists
 * and rows on the plain background are the default; a Panel means "this is a
 * distinct thing", not "this is content".
 */
export function Panel({
    children,
    className,
    padded = true,
}: {
    children: React.ReactNode
    className?: string
    padded?: boolean
}) {
    return (
        <div className={cn(R.lg, SURFACE, padded && 'p-4', className)}>{children}</div>
    )
}

export function Divider({ className }: { className?: string }) {
    return <div className={cn('border-b', HAIRLINE, className)} />
}
