'use client'

import { cn } from '@/lib/utils'
import { R } from '@/lib/second-brain/ui'

/**
 * A key cap.
 *
 * Fixed minimum width so a row of them stays on a grid whether the label is "D"
 * or "→", and `font-mono` so glyph widths don't jitter between keys.
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <kbd
            className={cn(
                'inline-flex h-[19px] min-w-[19px] items-center justify-center px-[5px]',
                R.sm,
                'border border-black/[0.09] bg-black/[0.03] dark:border-white/[0.11] dark:bg-white/[0.06]',
                'font-mono text-[10.5px] font-medium leading-none text-muted-foreground',
                className
            )}
        >
            {children}
        </kbd>
    )
}
