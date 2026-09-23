'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { updateTask } from '@/lib/actions/tasks'
import { saveFailed, useApplyTaskUpdate } from './parts'
import { INK, T } from '@/lib/second-brain/ui'

/**
 * Notes, directly under the title.
 *
 * Borderless and unlabelled — it reads as the body of the task, the way the
 * "why" sits under a goal's title. It grows with what's written and saves when
 * focus leaves.
 */
export function TaskDescription({
    task,
    isReadOnly = false,
}: {
    task: { id: string; description?: string | null }
    isReadOnly?: boolean
}) {
    const router = useRouter()
    const apply = useApplyTaskUpdate(task)
    const [description, setDescription] = useState(task.description ?? '')

    // Follow changes made elsewhere, adjusting during render rather than in an effect.
    const [seen, setSeen] = useState(task.description ?? '')
    if (seen !== (task.description ?? '')) {
        setSeen(task.description ?? '')
        setDescription(task.description ?? '')
    }

    const save = async () => {
        if (description === (task.description ?? '')) return

        const result = await updateTask({ id: task.id, description })
        if (!result.success) {
            saveFailed('the description', result.error)
            return
        }
        apply(result.data)
        router.refresh()
    }

    if (isReadOnly && !description) return null

    return (
        <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={save}
            readOnly={isReadOnly}
            rows={1}
            placeholder="Add details…"
            aria-label="Description"
            className={cn(
                // Indented to line up with the title, past the checkbox.
                'w-full resize-none bg-transparent pl-9 outline-none [field-sizing:content]',
                T.body, 'text-[13.5px] leading-[1.6]', INK.muted,
                'placeholder:text-muted-foreground/45'
            )}
        />
    )
}
