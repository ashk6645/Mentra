'use client'

import { formatDistanceToNow, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import { HAIRLINE, INK, NUM, T } from '@/lib/second-brain/ui'

function ago(value: Date | string | null | undefined): string | null {
    if (!value) return null
    const date = new Date(value)
    return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : null
}

/** When the task was made and last touched — quiet, at the bottom, out of the way. */
export function TaskDetailFooter({
    task,
}: {
    task: { createdAt?: Date | string | null; updatedAt?: Date | string | null }
}) {
    const created = ago(task.createdAt)
    const updated = ago(task.updatedAt)
    if (!created && !updated) return null

    return (
        <footer className={cn('flex h-10 shrink-0 items-center justify-between gap-3 border-t px-5 sm:px-6', HAIRLINE, T.meta, NUM, INK.subtle)}>
            <span>{created ? `Created ${created}` : ''}</span>
            <span>{updated ? `Updated ${updated}` : ''}</span>
        </footer>
    )
}
