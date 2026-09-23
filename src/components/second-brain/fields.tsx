'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ICONS, ItemIcon } from '@/lib/second-brain/icons'
import { WEEK_ORDER, longDayName } from '@/lib/second-brain/date'
import { FIELD_FOCUS, FOCUS, HAIRLINE, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

/**
 * Form controls for Second Brain's dialogs and panels.
 *
 * One height (32px), one radius, one focus treatment. The border warms toward the
 * accent and a soft halo appears on focus — the same on every field, so moving
 * through a form feels like one control rather than several.
 */

/** A labelled row in a form. */
export function Field({
    label,
    hint,
    children,
    htmlFor,
}: {
    label: string
    hint?: ReactNode
    children: ReactNode
    htmlFor?: string
}) {
    const labelClass = cn(T.caption, 'text-[12px]', INK.muted)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
                {/* A real <label> only when there is a single control to point at;
                    a picker or segmented group names itself. */}
                {htmlFor ? (
                    <label htmlFor={htmlFor} className={labelClass}>{label}</label>
                ) : (
                    <span className={labelClass}>{label}</span>
                )}
                {hint && <span className={cn(T.meta, NUM, INK.subtle)}>{hint}</span>}
            </div>
            {children}
        </div>
    )
}

const INPUT = cn(
    'w-full border bg-transparent px-2.5', R.md, T.body, HAIRLINE, INK.strong,
    'placeholder:text-muted-foreground/55', TRANSITION.fast, FIELD_FOCUS
)

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
    return <input className={cn(INPUT, 'h-8', className)} {...props} />
}

/** A native date input, styled to match. Native keeps the platform's picker. */
export function DateInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
    return (
        <input
            type="date"
            className={cn(INPUT, 'h-8 w-auto', NUM, '[color-scheme:light] dark:[color-scheme:dark]', className)}
            {...props}
        />
    )
}

/**
 * A whole-number stepper. The buttons do the common thing — nudge by one — and
 * the field in between takes a typed value for bigger jumps.
 */
export function Stepper({
    value,
    onChange,
    min = 0,
    max = 999_999,
    label,
    suffix,
}: {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    label: string
    suffix?: string
}) {
    const clamp = (n: number) => Math.min(max, Math.max(min, n))

    const step = cn(
        'flex h-full w-8 items-center justify-center', INK.muted, TRANSITION.fast, FOCUS,
        'hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]',
        'disabled:pointer-events-none disabled:opacity-30'
    )

    return (
        <div className={cn('inline-flex h-8 items-center overflow-hidden border', R.md, HAIRLINE)}>
            <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min}
                aria-label={`Decrease ${label}`} className={step}>
                <Minus className={ICON.sm} strokeWidth={2.25} />
            </button>
            <input
                value={value}
                onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    onChange(clamp(digits === '' ? min : Number(digits)))
                }}
                inputMode="numeric"
                aria-label={label}
                className={cn(
                    'h-full w-14 border-x bg-transparent text-center outline-none', HAIRLINE, T.body, NUM, INK.strong,
                    'focus:bg-black/[0.02] dark:focus:bg-white/[0.03]'
                )}
            />
            <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={value >= max}
                aria-label={`Increase ${label}`} className={step}>
                <Plus className={ICON.sm} strokeWidth={2.25} />
            </button>
            {suffix && <span className={cn('border-l px-2.5', HAIRLINE, T.meta, INK.muted)}>{suffix}</span>}
        </div>
    )
}

/** Monday-first weekday toggles. */
export function DayPicker({
    value,
    onChange,
}: {
    value: number[]
    onChange: (days: number[]) => void
}) {
    const toggle = (day: number) =>
        onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day])

    return (
        <div className="grid grid-cols-7 gap-1.5">
            {WEEK_ORDER.map(day => {
                const on = value.includes(day)
                return (
                    <button
                        key={day}
                        type="button"
                        onClick={() => toggle(day)}
                        aria-pressed={on}
                        aria-label={longDayName(day)}
                        className={cn(
                            'h-8 border', R.md, T.button, 'text-[12px]', TRANSITION.fast, FOCUS,
                            on
                                ? 'border-transparent bg-foreground text-background'
                                : cn(HAIRLINE, INK.muted, 'hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.05]')
                        )}
                    >
                        {longDayName(day).slice(0, 2)}
                    </button>
                )
            })}
        </div>
    )
}

/** The icon grid, 8 × 2. */
export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
    return (
        <div role="radiogroup" aria-label="Icon" className="grid grid-cols-8 gap-1.5">
            {ICONS.map(({ id, label }) => {
                const on = value === id
                return (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={label}
                        title={label}
                        onClick={() => onChange(id)}
                        className={cn(
                            'flex h-9 items-center justify-center border', R.md, TRANSITION.fast, FOCUS,
                            on
                                ? 'border-foreground/25 bg-black/[0.05] text-foreground dark:border-white/30 dark:bg-white/[0.08]'
                                : cn('border-transparent', INK.muted, 'hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]')
                        )}
                    >
                        <ItemIcon icon={id} className={ICON.lg} />
                    </button>
                )
            })}
        </div>
    )
}
