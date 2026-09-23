'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { TaskDetailHeader, TaskTitle } from './task-detail-header'
import { TaskMetadataRow } from './task-metadata-row'
import { TaskDescription } from './task-description'
import { TaskSubtasks } from './task-subtasks'
import { TaskAIAssist } from './task-ai-assist'
import { TaskDetailFooter } from './task-detail-footer'
import { cn } from '@/lib/utils'
import { FLOAT, MOTION, R } from '@/lib/second-brain/ui'

/**
 * Is an Escape press meant for something layered on top of the panel?
 * A popover, a menu, or a field being edited should take it first.
 */
function escapeBelongsElsewhere(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, [contenteditable="true"]')) return true
    return document.querySelector('[data-radix-popper-content-wrapper], [role="dialog"], [role="alertdialog"]') !== null
}

/**
 * The task detail panel.
 *
 * A floating card docked to the right edge, drawn the same way as Second Brain's
 * goal panel. Unlike that one it has no backdrop: the task list stays live
 * behind it, so clicking another task simply swaps what the panel shows.
 *
 * It slides only 24px, on the shared curve — the eye should notice something
 * arrived, not watch it travel.
 */
export function TaskDetailPanel({ className }: { className?: string }) {
    const { selectedTask, selectedTaskId, isOpen, isReadOnly, closePanel } = useTaskDetailStore()

    useEffect(() => {
        if (!isOpen) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || escapeBelongsElsewhere(event)) return
            closePanel()
        }

        // Capture phase, so this looks before Radix does: Radix closes an open
        // popover on the same key press, and by the bubble phase it would be gone —
        // one Escape would then close the popover and the panel together.
        window.addEventListener('keydown', onKeyDown, { capture: true })
        return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
    }, [isOpen, closePanel])

    return (
        <AnimatePresence>
            {isOpen && selectedTask && (
                <motion.aside
                    aria-label="Task details"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={MOTION.slow}
                    className={cn(
                        'fixed inset-y-2 right-2 z-50 flex w-[calc(100%-16px)] max-w-[520px] flex-col overflow-hidden',
                        R.xl, FLOAT,
                        className
                    )}
                >
                    {/* Keyed by task, so switching tasks cross-fades and every
                        section starts from the new task's values. */}
                    <motion.div
                        key={selectedTaskId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={MOTION.base}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <TaskDetailHeader task={selectedTask} onClose={closePanel} />

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="flex flex-col gap-7 px-5 py-6 sm:px-6">
                                <div className="flex flex-col gap-1.5">
                                    <TaskTitle task={selectedTask} />
                                    <TaskDescription task={selectedTask} isReadOnly={isReadOnly} />
                                </div>
                                <TaskMetadataRow task={selectedTask} isReadOnly={isReadOnly} />
                                <TaskSubtasks task={selectedTask} isReadOnly={isReadOnly} />
                                {!isReadOnly && <TaskAIAssist task={selectedTask} />}
                            </div>
                        </div>

                        <TaskDetailFooter task={selectedTask} />
                    </motion.div>
                </motion.aside>
            )}
        </AnimatePresence>
    )
}
