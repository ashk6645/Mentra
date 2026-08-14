'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOCUS, ICON, INK, R, T } from '@/lib/second-brain/ui'

/**
 * The empty state, for every list in Second Brain.
 *
 * There were twenty-three of these, hand-rolled per screen, with five different
 * vertical paddings and three different ways of writing the same sentence. An
 * empty state is often the first thing someone sees on a screen, so having it
 * drawn differently everywhere is the most visible kind of drift there is.
 *
 * No border. Everything else in the feature stopped being a card, and a lone
 * bordered box announcing "nothing here" gave the absence of content more chrome
 * than the content itself gets.
 *
 * `title` states what is missing. `description` — optional — says what the thing
 * is for, because an empty list is the one moment the reader genuinely might not
 * know. `action` resolves it, when there is a single obvious way to.
 */
export function EmptyState({
    title,
    description,
    action,
}: {
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
}) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className={cn(T.body, INK.muted)}>{title}</p>

            {description && (
                <p className={cn('mt-1.5 max-w-[340px]', T.label, INK.subtle)}>{description}</p>
            )}

            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                        'mt-5 flex items-center gap-1.5 px-3 py-2', R.md, T.button,
                        'bg-foreground text-background transition-opacity hover:opacity-90',
                        FOCUS
                    )}
                >
                    <Plus className={ICON.md} />
                    {action.label}
                </button>
            )}
        </div>
    )
}
