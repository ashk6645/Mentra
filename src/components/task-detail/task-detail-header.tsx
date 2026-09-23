'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/second-brain/checkbox'
import { ActionMenu } from '@/components/second-brain/menu'
import { IconButton } from '@/components/second-brain/primitives'
import { useConfirm } from '@/components/second-brain/confirm-dialog'
import { deleteTask, toggleTaskCompletion, updateTask } from '@/lib/actions/tasks'
import { saveFailed, useApplyTaskUpdate } from './parts'
import { FOCUS, HAIRLINE, INK, T } from '@/lib/second-brain/ui'

interface HeaderTask {
    id: string
    title: string
    completed: boolean
    project?: { name: string; icon: string | null } | null
    section?: { name: string } | null
}

/**
 * The panel's top bar: where the task lives, and the two things you do to the
 * panel itself — act on the task, or close it.
 */
export function TaskDetailHeader({ task, onClose }: { task: HeaderTask; onClose: () => void }) {
    const router = useRouter()
    const { confirm, dialog } = useConfirm()

    const remove = async () => {
        const confirmed = await confirm({
            title: 'Delete this task?',
            description: `“${task.title}” and its subtasks will be deleted. This can’t be undone.`,
            confirmLabel: 'Delete task',
            destructive: true,
        })
        if (!confirmed) return

        const result = await deleteTask(task.id)
        if (!result.success) {
            saveFailed('the task', result.error)
            return
        }
        onClose()
        router.refresh()
    }

    return (
        <header className={cn('flex h-12 shrink-0 items-center justify-between gap-3 border-b pl-5 pr-3', HAIRLINE)}>
            {dialog}

            {/* Where it lives — the one piece of context the title can't give. */}
            <div className={cn('flex min-w-0 items-center gap-1.5', T.meta, INK.muted)}>
                {task.project ? (
                    <>
                        <span aria-hidden className="shrink-0">{task.project.icon || '📁'}</span>
                        <span className="truncate">{task.project.name}</span>
                        {task.section && (
                            <>
                                <span aria-hidden className={INK.subtle}>/</span>
                                <span className="truncate">{task.section.name}</span>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Inbox className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                        <span>Inbox</span>
                    </>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <ActionMenu
                    label="Task actions"
                    actions={[{ label: 'Delete task', icon: Trash2, destructive: true, onSelect: remove }]}
                />
                <IconButton icon={X} label="Close" onClick={onClose} />
            </div>
        </header>
    )
}

/**
 * The checkbox and the title, edited in place.
 *
 * Completing goes through `toggleTaskCompletion` — the same path as the task
 * list — so a repeating task schedules its next occurrence whichever place it
 * was ticked from. It used to go through `updateTask` here, which skipped that.
 */
export function TaskTitle({ task }: { task: HeaderTask }) {
    const router = useRouter()
    const apply = useApplyTaskUpdate(task)
    const [title, setTitle] = useState(task.title)
    const [completed, setCompleted] = useState(task.completed)
    const [pending, setPending] = useState(false)

    // Follow changes made elsewhere — AI assist rewriting the title, say — by
    // adjusting state during render, as React recommends over a syncing effect.
    const [seen, setSeen] = useState({ title: task.title, completed: task.completed })
    if (seen.title !== task.title || seen.completed !== task.completed) {
        setSeen({ title: task.title, completed: task.completed })
        setTitle(task.title)
        setCompleted(task.completed)
    }

    const toggle = async () => {
        if (pending) return
        const next = !completed
        setCompleted(next)
        setPending(true)

        const result = await toggleTaskCompletion(task.id, next)
        setPending(false)

        if (!result.success) {
            setCompleted(!next)
            saveFailed('the task', result.error)
            return
        }
        apply(undefined, { completed: next })
        router.refresh()
    }

    const saveTitle = async () => {
        const clean = title.trim()
        if (!clean) {
            setTitle(task.title)
            return
        }
        if (clean === task.title) return

        const result = await updateTask({ id: task.id, title: clean })
        if (!result.success) {
            setTitle(task.title)
            saveFailed('the title', result.error)
            return
        }
        apply(result.data)
        router.refresh()
    }

    return (
        <div className="flex items-start gap-3">
            <button
                type="button"
                onClick={toggle}
                aria-pressed={completed}
                aria-label={completed ? 'Mark as not done' : 'Mark as done'}
                className={cn('group mt-[5px] flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]', FOCUS)}
            >
                <Checkbox checked={completed} />
            </button>

            <div className="min-w-0 flex-1">
                <textarea
                    value={title}
                    onChange={e => setTitle(e.target.value.replace(/\n/g, ''))}
                    onBlur={saveTitle}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                        }
                        if (e.key === 'Escape') {
                            setTitle(task.title)
                            e.currentTarget.blur()
                        }
                    }}
                    readOnly={completed}
                    rows={1}
                    maxLength={500}
                    aria-label="Task title"
                    className={cn(
                        'w-full resize-none bg-transparent outline-none [field-sizing:content]',
                        'text-[20px] font-semibold leading-[1.3] tracking-[-0.02em]',
                        'placeholder:text-muted-foreground/45 transition-colors duration-200',
                        completed ? cn(INK.subtle, 'line-through decoration-foreground/25') : INK.strong
                    )}
                />
                {completed && (
                    <p className={cn('mt-1', T.meta, INK.subtle)}>Completed · untick to edit</p>
                )}
            </div>
        </div>
    )
}
