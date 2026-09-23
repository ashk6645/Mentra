'use client'

import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { FLOAT, FOCUS, HAIRLINE, ICON, INK, R, T, TRANSITION } from '@/lib/second-brain/ui'

/**
 * Building blocks shared by the task detail panel's sections.
 *
 * The panel follows the same design language as Second Brain's goal panel —
 * its tokens come from the same file — so a task and a goal feel like two views
 * of one product rather than two products.
 */

/** A labelled section below the title: a hairline, a heading, then its content. */
export function Section({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
    return (
        <section className={cn('flex flex-col gap-2 border-t pt-5', HAIRLINE)}>
            <div className="flex items-center justify-between gap-3">
                <h3 className={cn(T.title, 'text-[13px]', INK.strong)}>{title}</h3>
                {meta}
            </div>
            {children}
        </section>
    )
}

/** A property row: label on the left, control on the right. */
export function Property({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid min-h-9 grid-cols-[104px_1fr] items-center gap-3">
            <span className={cn(T.meta, INK.muted)}>{label}</span>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
        </div>
    )
}

/**
 * The clickable value in a property row.
 *
 * Quiet until hovered: it reads as text, and only reveals that it is a control
 * when the pointer arrives — the way Linear's issue properties behave.
 */
export const ValueButton = forwardRef<
    HTMLButtonElement,
    ComponentProps<'button'> & { icon?: LucideIcon; iconClassName?: string; empty?: boolean }
>(function ValueButton({ icon: Icon, iconClassName, empty, children, className, type = 'button', ...props }, ref) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(
                '-ml-2 inline-flex h-8 min-w-0 max-w-full items-center gap-2 px-2', R.md, T.body,
                empty ? INK.subtle : INK.strong,
                'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]', TRANSITION.fast, FOCUS,
                'disabled:pointer-events-none',
                className
            )}
            {...props}
        >
            {Icon && <Icon className={cn(ICON.md, 'shrink-0', empty ? 'opacity-60' : INK.muted, iconClassName)} strokeWidth={1.75} />}
            <span className="truncate">{children}</span>
        </button>
    )
})

/** Classes for popover and dropdown surfaces opened from the panel. */
export const POPOVER = cn(R.lg, FLOAT, 'p-1 duration-[120ms]')

/** One row inside a popover list. */
export function OptionRow({
    selected,
    onSelect,
    children,
    tone,
}: {
    selected?: boolean
    onSelect: () => void
    children: ReactNode
    tone?: 'danger'
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'flex h-8 w-full items-center gap-2.5 px-2 text-left', R.md, T.body, TRANSITION.fast, FOCUS,
                tone === 'danger' ? 'text-red-600 dark:text-red-400' : INK.strong,
                selected ? 'bg-black/[0.05] dark:bg-white/[0.07]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            )}
        >
            {children}
        </button>
    )
}

/**
 * Write an action's result back into the open panel.
 *
 * `updateTask` returns the task without its subtasks, project or section, so
 * replacing the panel's copy with it wiped those out. Merging keeps what the
 * response doesn't carry; `extra` supplies relations the caller changed itself.
 */
export function useApplyTaskUpdate<T extends { id: string }>(task: T) {
    const selectTask = useTaskDetailStore(state => state.selectTask)

    return (data: object | undefined, extra: object = {}) => {
        const current = useTaskDetailStore.getState().selectedTask
        // The panel may have moved on to another task while this was in flight.
        if (!current || current.id !== task.id) return
        selectTask(task.id, { ...current, ...(data ?? {}), ...extra })
    }
}

/** A failed save. Successes are silent — the change on screen is the confirmation. */
export function saveFailed(what: string, detail?: string) {
    toast.error(`Couldn’t update ${what}`, { description: detail })
}
