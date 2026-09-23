'use client'

import { memo, type ComponentProps, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './animated-number'
import { Kbd } from './kbd'
import {
    BEHIND, CARD, DONE, DURATION, EASE, FILL, FOCUS, HAIRLINE, ICON, INK, NUM, R,
    REVEAL_STAGGER, T, TRANSITION,
} from '@/lib/second-brain/ui'

/**
 * The building blocks every Second Brain screen is made of.
 *
 * Four screens, one vocabulary: a page is a header, a stat strip and cards of
 * rows, and every one of those is drawn here. A screen that hand-rolls its own
 * version of any of them is how drift starts.
 */

// ─── Entrance ────────────────────────────────────────────────────────────────

/**
 * Staggered entrance for a page's sections.
 *
 * Each section rises 6px and fades in, 45ms after the one above it — enough to
 * read as one composed arrival rather than a flash, short enough that the last
 * section is settled well inside half a second — the delay is capped, so a long
 * list of cards doesn't keep arriving. Reduced motion is handled by the
 * MotionConfig in the layout, which turns this into a plain fade.
 */
export function Reveal({
    index = 0,
    children,
    className,
}: {
    index?: number
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE, delay: Math.min(index, 6) * REVEAL_STAGGER }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ─── Headings ────────────────────────────────────────────────────────────────

export function PageHeader({
    title,
    description,
    actions,
}: {
    title: string
    description?: ReactNode
    actions?: ReactNode
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
                <h1 className={cn(T.display, INK.strong)}>{title}</h1>
                {description && <p className={cn('mt-1.5', T.body, INK.muted)}>{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    )
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<ButtonVariant, string> = {
    primary: 'bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-foreground/88',
    secondary: cn(
        'border bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]', HAIRLINE,
        'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
    ),
    ghost: cn(INK.muted, 'hover:bg-black/[0.045] hover:text-foreground dark:hover:bg-white/[0.06]'),
    danger: 'text-red-600 hover:bg-red-500/[0.08] dark:text-red-400 dark:hover:bg-red-500/[0.12]',
}

const SIZE = {
    sm: 'h-7 gap-1.5 px-2.5 text-[12.5px]',
    md: 'h-8 gap-1.5 px-3',
} as const

export function Button({
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    kbd,
    children,
    className,
    type = 'button',
    ...props
}: ComponentProps<'button'> & {
    variant?: ButtonVariant
    size?: keyof typeof SIZE
    icon?: LucideIcon
    /** A shortcut hint, shown inside the button from `sm` up. */
    kbd?: string
}) {
    return (
        <button
            type={type}
            className={cn(
                'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap',
                R.md, T.button, SIZE[size], VARIANT[variant], TRANSITION.fast, FOCUS,
                'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
                className
            )}
            {...props}
        >
            {Icon && <Icon className={ICON.md} strokeWidth={2} />}
            {children}
            {kbd && (
                <Kbd
                    className={cn(
                        'ml-0.5 hidden sm:inline-flex',
                        variant === 'primary' && 'border-white/20 bg-white/10 text-background/70 dark:border-black/15 dark:bg-black/10'
                    )}
                >
                    {kbd}
                </Kbd>
            )}
        </button>
    )
}

/** A square, icon-only button. Always carries an accessible name. */
export function IconButton({
    icon: Icon,
    label,
    size = 'md',
    className,
    type = 'button',
    ...props
}: ComponentProps<'button'> & { icon: LucideIcon; label: string; size?: 'sm' | 'md' }) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex shrink-0 items-center justify-center', R.md,
                size === 'sm' ? 'h-6 w-6' : 'h-7 w-7',
                INK.muted, 'hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.07]',
                TRANSITION.fast, FOCUS, 'disabled:pointer-events-none disabled:opacity-30',
                className
            )}
            {...props}
        >
            <Icon className={ICON.md} strokeWidth={2} />
        </button>
    )
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return <section className={cn(R.lg, CARD, 'overflow-hidden', className)}>{children}</section>
}

/** The strip across the top of a card: what it is, how many, and one action. */
export function CardHeader({
    title,
    meta,
    action,
}: {
    title: string
    meta?: ReactNode
    action?: ReactNode
}) {
    return (
        <header className={cn('flex h-11 items-center justify-between gap-3 border-b px-4', HAIRLINE)}>
            <div className="flex min-w-0 items-center gap-2">
                <h2 className={cn(T.title, 'text-[13px]', INK.strong)}>{title}</h2>
                {meta !== undefined && <span className={cn(T.meta, NUM, INK.subtle)}>{meta}</span>}
            </div>
            {action}
        </header>
    )
}

// ─── Stats ───────────────────────────────────────────────────────────────────

/**
 * The strip of figures at the top of every screen.
 *
 * One card, cells divided by hairlines. The same component on all four screens,
 * so the eye learns where to look once.
 */
export function StatGrid({ children, columns = 3 }: { children: ReactNode; columns?: 3 | 4 }) {
    return (
        <Card>
            {/* The dividers are the 1px gaps showing the grid's own fill through,
                so they stay exact at any column count — 2×2 on a phone, 4×1 wide. */}
            <div
                className={cn(
                    'grid gap-px bg-black/[0.07] dark:bg-white/[0.07]',
                    columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
                )}
            >
                {children}
            </div>
        </Card>
    )
}

export function Stat({
    label,
    value,
    suffix,
    detail,
    visual,
}: {
    label: string
    value: number | string
    /** Quieter text straight after the figure: "/5", "%". */
    suffix?: string
    /** A line under the figure. */
    detail?: ReactNode
    /** A ring or glyph to the right of the figure. */
    visual?: ReactNode
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3 bg-card px-4 py-4 sm:px-5">
            <div className="flex min-w-0 flex-col gap-2">
                <span className={cn(T.meta, 'truncate', INK.muted)}>{label}</span>
                <span className={cn(T.figure, INK.strong)}>
                    {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
                    {suffix && <span className={cn('ml-0.5 text-[15px] font-medium tracking-[-0.01em]', INK.subtle)}>{suffix}</span>}
                </span>
                {detail && <span className={cn(T.meta, 'truncate', INK.subtle)}>{detail}</span>}
            </div>
            {visual && <div className="hidden shrink-0 sm:block">{visual}</div>}
        </div>
    )
}

// ─── Progress ────────────────────────────────────────────────────────────────

export const ProgressBar = memo(function ProgressBar({
    percent,
    complete,
    className,
    label,
}: {
    percent: number
    /** Switch to the completion accent. Defaults to "at 100%". */
    complete?: boolean
    className?: string
    label?: string
}) {
    const clamped = Math.min(100, Math.max(0, percent))
    const isComplete = complete ?? clamped === 100

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuenow={Math.round(clamped)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn('h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]', className)}
        >
            <motion.div
                className={cn('h-full rounded-full', isComplete ? DONE.fill : 'bg-foreground/70')}
                initial={false}
                animate={{ width: `${clamped}%` }}
                transition={FILL}
            />
        </div>
    )
})

/** Circular gauge. Reads faster than a bar at small sizes. */
export const Ring = memo(function Ring({
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
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const clamped = Math.min(100, Math.max(0, percent))
    const isComplete = complete ?? clamped === 100

    return (
        <svg
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            className="shrink-0 -rotate-90"
            aria-hidden
        >
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" strokeWidth={stroke}
                className="stroke-black/[0.07] dark:stroke-white/[0.09]"
            />
            <motion.circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" strokeWidth={stroke} strokeLinecap="round"
                className={cn(isComplete ? DONE.stroke : 'stroke-foreground/80', 'transition-[stroke] duration-200')}
                strokeDasharray={circumference}
                initial={false}
                animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
                transition={FILL}
            />
        </svg>
    )
})

// ─── Status ──────────────────────────────────────────────────────────────────

type Tone = 'neutral' | 'done' | 'behind'

/**
 * A status as a dot and a word.
 *
 * Not a filled pill: a column of pills turns a calm list into a field of chips.
 * The dot carries the colour; the word stays readable ink.
 */
export function Status({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', T.meta, INK.muted)}>
            <span
                aria-hidden
                className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    tone === 'done' ? DONE.fill : tone === 'behind' ? BEHIND.dot : 'bg-foreground/25'
                )}
            />
            <span className={cn(tone === 'behind' && BEHIND.text, tone === 'done' && DONE.text)}>{children}</span>
        </span>
    )
}

// ─── Text ────────────────────────────────────────────────────────────────────

/**
 * Text that gets struck through when done — drawn, not toggled.
 *
 * The line is its own element scaling in from the left, so ticking something off
 * reads as crossing it out rather than a style snapping on. Single-line only,
 * which every place that uses it is.
 */
export function Strike({ done, children, className }: { done: boolean; children: ReactNode; className?: string }) {
    return (
        // The outer span takes the layout (flex-1 and friends); the inner one hugs
        // the text, so the line is exactly as long as the words it crosses out.
        <span className={cn('flex min-w-0', className)}>
            <span className="relative min-w-0 max-w-full truncate">
                <span className={cn('transition-colors duration-200', done ? INK.subtle : INK.strong)}>{children}</span>
                <span
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute inset-x-0 top-1/2 h-px origin-left bg-current opacity-60',
                        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        INK.subtle,
                        done ? 'scale-x-100' : 'scale-x-0'
                    )}
                />
            </span>
        </span>
    )
}

// ─── Empty ───────────────────────────────────────────────────────────────────

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    compact,
}: {
    icon?: LucideIcon
    title: string
    description?: string
    action?: ReactNode
    /** Inside a dashboard card, where the full treatment would dominate. */
    compact?: boolean
}) {
    return (
        <div className={cn('flex flex-col items-center px-6 text-center', compact ? 'py-8' : 'py-16')}>
            {Icon && !compact && (
                <span
                    className={cn(
                        'mb-4 flex h-10 w-10 items-center justify-center border', R.lg, HAIRLINE,
                        'bg-gradient-to-b from-black/[0.015] to-black/[0.04] dark:from-white/[0.03] dark:to-white/[0.06]'
                    )}
                >
                    <Icon className={cn(ICON.lg, INK.muted)} strokeWidth={1.75} />
                </span>
            )}
            <p className={cn(T.body, 'font-medium', INK.strong)}>{title}</p>
            {description && <p className={cn('mt-1 max-w-[320px]', T.meta, INK.muted)}>{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}
