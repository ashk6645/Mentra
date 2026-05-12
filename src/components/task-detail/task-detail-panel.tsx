'use client'

import { useEffect } from 'react'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { TaskDetailHeader } from './task-detail-header'
import { TaskMetadataRow } from './task-metadata-row'
import { TaskDescription } from './task-description'
import { TaskSubtasks } from './task-subtasks'
import { TaskAIAssist } from './task-ai-assist'
import { TaskDetailFooter } from './task-detail-footer'
import { cn } from '@/lib/utils'

interface TaskDetailPanelProps {
  className?: string
}

export function TaskDetailPanel({ className }: TaskDetailPanelProps) {
  const { selectedTask, selectedTaskId, isOpen, isReadOnly, closePanel } = useTaskDetailStore()
  const prefersReducedMotion = useReducedMotion()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closePanel])



  const slideTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : {
        type: 'tween' as const,
        duration: 0.38,
        ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
      }

  return (
    <AnimatePresence mode="sync">
      {isOpen && selectedTask && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={slideTransition}
          className={cn(
            'fixed top-0 right-0 h-screen w-full md:w-[520px] z-50',
            'bg-background/92 backdrop-blur-xl backdrop-saturate-150',
            'border-l border-border/40',
            'flex flex-col overflow-hidden will-change-transform',
            className
          )}
        >
          <div
            key={selectedTaskId}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Sticky Header */}
            <TaskDetailHeader task={selectedTask} onClose={closePanel} isReadOnly={isReadOnly} />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-5 sm:px-7 py-6 sm:py-8 space-y-8">
                {/* Metadata Pills */}
                <TaskMetadataRow task={selectedTask} isReadOnly={isReadOnly} />

                {/* Description */}
                <TaskDescription task={selectedTask} isReadOnly={isReadOnly} />

                {/* Subtasks */}
                <TaskSubtasks task={selectedTask} isReadOnly={isReadOnly} />

                {/* AI Assist */}
                <TaskAIAssist task={selectedTask} />
              </div>
            </div>

            {/* Footer */}
            <TaskDetailFooter task={selectedTask} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
