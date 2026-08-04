'use client'

import { Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOCUS, HAIRLINE, ICON, SURFACE } from '@/lib/second-brain/ui'

/**
 * Shown when there are no habits at all.
 *
 * A single line of grey text in a dashed box is the default every side project
 * ships. An empty state is the first thing a new user sees, so it gets a mark, a
 * sentence that explains what the thing is for, and the action that resolves it.
 */
export function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className={cn('flex flex-col items-center rounded-[12px] px-6 py-16 text-center', SURFACE)}>
            <span
                className={cn(
                    'mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] border',
                    HAIRLINE,
                    'bg-foreground/[0.03]'
                )}
            >
                <Sparkles className={cn(ICON.lg, "text-foreground/50")} strokeWidth={1.75} />
            </span>

            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                Nothing to track yet
            </h3>
            <p className="mt-1.5 max-w-[280px] text-[13px] leading-[1.5] text-muted-foreground">
                Add the things you want to repeat — gym, reading, a nightly review — and
                tick them off as the week goes.
            </p>

            <button
                type="button"
                onClick={onAdd}
                className={cn(
                    'mt-6 flex items-center gap-1.5 rounded-[8px] bg-foreground px-3.5 py-2',
                    'text-[13px] font-medium text-background transition-opacity hover:opacity-90',
                    FOCUS
                )}
            >
                <Plus className="h-3.5 w-3.5" />
                Add your first habit
            </button>
        </div>
    )
}
