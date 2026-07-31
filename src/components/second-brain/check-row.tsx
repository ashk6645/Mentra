'use client'

import { memo } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckRowProps {
    id: string
    label: string
    icon?: string
    completed: boolean
    /** Shown on the right on hover — "every Mon, Wed, Fri" and the like. */
    hint?: string
    onToggle: (id: string) => void
    onDelete?: (id: string) => void
    deleteLabel?: string
}

/**
 * One tickable line — a habit or a one-off task.
 *
 * The whole row is the button, so the tap target is comfortable on a phone. Delete
 * is a separate control layered on top, with `stopPropagation` so it cannot also
 * toggle the row.
 */
export const CheckRow = memo(function CheckRow({
    id,
    label,
    icon,
    completed,
    hint,
    onToggle,
    onDelete,
    deleteLabel = 'Delete',
}: CheckRowProps) {
    return (
        <div className="group relative flex items-stretch">
            <button
                type="button"
                onClick={() => onToggle(id)}
                aria-pressed={completed}
                className={cn(
                    'flex flex-1 items-center gap-3 rounded-lg px-2.5 py-2.5 text-left',
                    'transition-colors duration-150 outline-none',
                    'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'
                )}
            >
                {/* Checkbox */}
                <span
                    aria-hidden
                    className={cn(
                        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-all duration-150',
                        completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-400 dark:group-hover:border-neutral-500'
                    )}
                >
                    {completed && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>

                {icon && (
                    <span aria-hidden className="shrink-0 text-base leading-none">
                        {icon}
                    </span>
                )}

                <span
                    className={cn(
                        'flex-1 text-[14px] leading-snug transition-colors duration-150',
                        completed
                            ? 'text-muted-foreground line-through decoration-neutral-400'
                            : 'text-foreground'
                    )}
                >
                    {label}
                </span>

                {hint && (
                    <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">
                        {hint}
                    </span>
                )}
            </button>

            {onDelete && (
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation()
                        onDelete(id)
                    }}
                    aria-label={`${deleteLabel}: ${label}`}
                    className={cn(
                        'ml-1 flex w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground',
                        'opacity-0 transition-all duration-150 group-hover:opacity-100 focus-visible:opacity-100',
                        'hover:bg-neutral-200/70 hover:text-foreground dark:hover:bg-neutral-700/60',
                        'outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    )
})
