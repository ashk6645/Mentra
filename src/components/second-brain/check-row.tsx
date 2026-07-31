'use client'

import { memo } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SBCheckbox } from './checkbox'
import { FOCUS, HOVER } from '@/lib/second-brain/ui'

interface CheckRowProps {
    id: string
    label: string
    icon?: string
    completed: boolean
    /** Quiet right-aligned metadata, e.g. "Weekdays". */
    hint?: string
    onToggle: (id: string) => void
    onDelete?: (id: string) => void
    deleteLabel?: string
}

/**
 * One tickable line — a habit or a one-off item.
 *
 * The whole row is the hit target so it stays comfortable on a phone. Delete sits
 * on top with `stopPropagation`, and reserves its width at all times so revealing
 * it on hover doesn't shift the label.
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
        <div className="group relative flex items-center">
            <button
                type="button"
                onClick={() => onToggle(id)}
                aria-pressed={completed}
                className={cn(
                    'flex flex-1 items-center gap-3 rounded-[10px] px-2 py-2 text-left',
                    'transition-colors duration-150',
                    HOVER,
                    FOCUS
                )}
            >
                <SBCheckbox checked={completed} />

                {icon && (
                    <span aria-hidden className="shrink-0 text-[15px] leading-none">
                        {icon}
                    </span>
                )}

                <span
                    className={cn(
                        'flex-1 text-[13.5px] leading-[1.45] transition-all duration-200',
                        completed
                            ? 'text-muted-foreground line-through decoration-black/25 dark:decoration-white/25'
                            : 'text-foreground'
                    )}
                >
                    {label}
                </span>

                {hint && (
                    <span className="hidden shrink-0 text-[11px] text-muted-foreground/80 sm:block">
                        {hint}
                    </span>
                )}
            </button>

            {/* Width is always reserved — revealing this must not reflow the row. */}
            <div className="w-7 shrink-0">
                {onDelete && (
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation()
                            onDelete(id)
                        }}
                        aria-label={`${deleteLabel}: ${label}`}
                        className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground/70',
                            'opacity-0 transition-all duration-150',
                            'group-hover:opacity-100 focus-visible:opacity-100',
                            'hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.07]',
                            FOCUS
                        )}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
})
