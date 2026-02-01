'use client'

import { useEffect } from 'react'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { motion, AnimatePresence } from 'framer-motion'
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
  const { selectedTask, selectedTaskId, isOpen, closePanel } = useTaskDetailStore()

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



  return (
    <AnimatePresence>
      {isOpen && selectedTask && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            'fixed top-0 right-0 h-screen w-[540px] z-50',
            'bg-sidebar/95 backdrop-blur-xl border-l border-sidebar-border shadow-sm',
            'flex flex-col overflow-hidden',
            className
          )}
        >
          <motion.div
            key={selectedTaskId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Sticky Header */}
            <TaskDetailHeader task={selectedTask} onClose={closePanel} />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-8 py-6 space-y-8">
                {/* Metadata Pills */}
                <TaskMetadataRow task={selectedTask} />

                {/* Description */}
                <TaskDescription task={selectedTask} />

                {/* Subtasks */}
                <TaskSubtasks task={selectedTask} />

                {/* AI Assist */}
                <TaskAIAssist task={selectedTask} />
              </div>
            </div>

            {/* Footer */}
            <TaskDetailFooter task={selectedTask} />
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
