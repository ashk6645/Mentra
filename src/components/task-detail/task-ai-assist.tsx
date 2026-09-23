'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Clock, Flag, ListTree, Loader2, Sparkles, Wand2, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { estimateTaskDuration, generateSubtasks, getTaskSuggestions, rewriteTaskTitle } from '@/lib/actions/ai'
import { createSubtask } from '@/lib/actions/subtasks'
import { updateTask, type UpdateTaskInput } from '@/lib/actions/tasks'
import { getTags } from '@/lib/actions/tags'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { saveFailed, useApplyTaskUpdate } from './parts'
import { FOCUS, HAIRLINE, HOVER, ICON, INK, MOTION, R, T, TRANSITION } from '@/lib/second-brain/ui'

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

function normalizeAiPriority(raw: string): (typeof VALID_PRIORITIES)[number] | undefined {
    const p = raw.trim().toLowerCase()
    return (VALID_PRIORITIES as readonly string[]).includes(p) ? (p as (typeof VALID_PRIORITIES)[number]) : undefined
}

interface AssistTask {
    id: string
    title: string
    description?: string | null
    scheduledStart?: Date | string | null
    tags?: { tag?: { id: string; name: string }; id?: string }[]
}

type ActionId = 'subtasks' | 'rewrite' | 'estimate' | 'priority'

const ACTIONS: { id: ActionId; label: string; hint: string; icon: LucideIcon }[] = [
    { id: 'subtasks', label: 'Break into subtasks', hint: 'Suggests the steps to get it done', icon: ListTree },
    { id: 'rewrite', label: 'Rewrite the title', hint: 'Makes it clear and actionable', icon: Wand2 },
    { id: 'estimate', label: 'Estimate time', hint: 'Suggests how long it will take', icon: Clock },
    { id: 'priority', label: 'Suggest priority and labels', hint: 'From the title and details', icon: Flag },
]

/**
 * AI assist — closed by default, and nothing runs until asked.
 *
 * Unlike the property edits, these do confirm with a toast: the result was
 * decided by the model rather than the person, so it's worth saying what changed.
 */
export function TaskAIAssist({ task }: { task: AssistTask }) {
    const router = useRouter()
    const apply = useApplyTaskUpdate(task)
    const [open, setOpen] = useState(false)
    const [running, setRunning] = useState<ActionId | null>(null)

    const run = async (id: ActionId) => {
        setRunning(id)
        try {
            if (id === 'subtasks') {
                const steps = await generateSubtasks(task.title, task.description || undefined)
                if (steps.length === 0) {
                    toast('No steps suggested', { description: 'Try adding a few details to the task first.' })
                    return
                }
                const created = []
                for (const step of steps) {
                    const result = await createSubtask(task.id, step.title)
                    if (result.success && result.data) created.push(result.data)
                }
                const existing = (useTaskDetailStore.getState().selectedTask?.subtasks ?? []) as object[]
                apply(undefined, { subtasks: [...existing, ...created] })
                toast(`Added ${created.length} subtask${created.length === 1 ? '' : 's'}`)
            }

            if (id === 'rewrite') {
                const title = await rewriteTaskTitle(task.title)
                if (!title) return
                const result = await updateTask({ id: task.id, title })
                if (!result.success) return saveFailed('the title', result.error)
                apply(result.data)
                toast('Title rewritten', { description: title })
            }

            if (id === 'estimate') {
                const minutes = await estimateTaskDuration(task.title, task.description || undefined)
                if (!minutes) return
                const patch: UpdateTaskInput = { id: task.id, durationMinutes: minutes }
                if (task.scheduledStart) {
                    patch.scheduledEnd = new Date(new Date(task.scheduledStart).getTime() + minutes * 60_000).toISOString()
                }
                const result = await updateTask(patch)
                if (!result.success) return saveFailed('the estimate', result.error)
                apply(result.data)
                toast(`Estimated at ${minutes} minutes`)
            }

            if (id === 'priority') {
                const available = await getTags()
                const suggestion = await getTaskSuggestions(
                    task.title,
                    task.description || undefined,
                    available.map(t => ({ id: t.id, name: t.name }))
                )
                const patch: UpdateTaskInput = { id: task.id }
                const priority = suggestion.priority ? normalizeAiPriority(suggestion.priority) : undefined
                if (priority) patch.priority = priority
                if (suggestion.tagIds?.length) {
                    const current = (task.tags?.map(t => t.tag?.id || t.id).filter(Boolean) as string[]) ?? []
                    patch.tagIds = Array.from(new Set([...current, ...suggestion.tagIds]))
                }
                if (!patch.priority && !patch.tagIds) {
                    toast('Nothing to suggest', { description: 'The task already looks well described.' })
                    return
                }
                const result = await updateTask(patch)
                if (!result.success) return saveFailed('the task', result.error)
                apply(result.data)
                toast('Suggestions applied')
            }

            router.refresh()
        } catch {
            toast.error('AI assist couldn’t finish', { description: 'Please try again in a moment.' })
        } finally {
            setRunning(null)
        }
    }

    return (
        <section className={cn('border-t pt-4', HAIRLINE)}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className={cn('-mx-2 flex h-9 w-[calc(100%+1rem)] items-center gap-2.5 px-2', R.md, HOVER, TRANSITION.fast, FOCUS)}
            >
                <Sparkles className={cn(ICON.md, INK.muted)} strokeWidth={1.75} />
                <span className={cn('flex-1 text-left', T.title, 'text-[13px]', INK.strong)}>AI assist</span>
                <ChevronRight
                    className={cn(ICON.md, INK.subtle, 'transition-transform duration-200', open && 'rotate-90')}
                    strokeWidth={2}
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={MOTION.base}
                        className="overflow-hidden"
                    >
                        <div className="-mx-2 flex flex-col pt-1">
                            {ACTIONS.map(action => (
                                <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => run(action.id)}
                                    disabled={running !== null}
                                    className={cn(
                                        'flex items-center gap-3 px-2 py-2 text-left', R.md, HOVER, TRANSITION.fast, FOCUS,
                                        'disabled:cursor-default',
                                        running !== null && running !== action.id && 'opacity-50'
                                    )}
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-black/[0.04] dark:bg-white/[0.06]">
                                        {running === action.id ? (
                                            <Loader2 className={cn(ICON.md, 'animate-spin', INK.muted)} />
                                        ) : (
                                            <action.icon className={cn(ICON.md, INK.default)} strokeWidth={1.75} />
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span className={cn('block', T.body, 'font-medium', INK.strong)}>{action.label}</span>
                                        <span className={cn('block', T.meta, INK.subtle)}>{action.hint}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
