'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createTask } from '@/lib/actions/tasks'
import { getTags } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import { Tag } from '@prisma/client'
import { TaskEditor } from './task-editor'
import { showErrorToast, showSuccessToast } from '@/lib/error-handler'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { AddTaskTrigger } from './add-task-trigger'

interface CreateTaskInlineProps {
    defaultStatus?: string
    defaultProjectId?: string
    defaultSectionId?: string
    placeholder?: string
    onTaskCreated?: (task: any) => void
    className?: string
    variant?: 'inline' | 'compact' | 'ghost'
    label?: string
}

export function CreateTaskInline({
    defaultStatus,
    defaultProjectId,
    defaultSectionId,
    placeholder,
    onTaskCreated,
    className,
    variant = 'inline',
    label
}: CreateTaskInlineProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const [tags, setTags] = useState<Tag[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if (isExpanded) {
            setIsLoadingData(true)
            getTags()
                .then((tagsData) => {
                    setTags(tagsData)
                })
                .catch((error) => {
                    showErrorToast(error, 'Failed to load tags')
                })
                .finally(() => {
                    setIsLoadingData(false)
                })
        }
    }, [isExpanded])

    async function handleTaskSubmit(data: {
        title: string
        description?: string
        dueDate?: Date
        priority?: 'low' | 'medium' | 'high' | 'urgent' | null
        scheduledTime?: string
        isRecurring?: boolean
        recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
        recurrenceStep?: number
        recurrenceDays?: number[]
        reminderPattern?: string
        projectId?: string
        sectionId?: string
        tagIds?: string[]
    }) {
        try {
            setIsSubmitting(true)

            const result = await createTask({
                title: data.title,
                description: data.description,
                priority: data.priority || undefined,
                dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
                reminderPattern: data.reminderPattern,
                // Use user selected project/section if available, otherwise default
                projectId: data.projectId || defaultProjectId,
                sectionId: data.sectionId || defaultSectionId,
                // Explicitly pass recurrence fields
                isRecurring: data.isRecurring,
                recurrenceInterval: data.recurrenceInterval,
                recurrenceStep: data.recurrenceStep,
                recurrenceDays: data.recurrenceDays,
                tagIds: data.tagIds
            })

            if (result.success) {
                showSuccessToast('Task created', 'Your task has been created successfully')
                setIsExpanded(false)
                router.refresh()
                if (onTaskCreated && result.data) {
                    onTaskCreated(result.data)
                }
            } else {
                showErrorToast(result.error || 'Failed to create task', 'Create task')
            }
        } catch (e) {
            console.error('Task creation exception:', e)
            showErrorToast(e, 'Failed to create task')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isExpanded) {
        return (
            <div className={cn("transition-all duration-300", className)}>
                <AddTaskTrigger
                    onClick={() => setIsExpanded(true)}
                    variant={variant}
                    label={label}
                />
            </div>
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                className={cn("overflow-hidden", className)}
            >
                <TaskEditor
                    availableTags={tags.map(t => ({ id: t.id, name: t.name }))}
                    onCancel={() => setIsExpanded(false)}
                    onSubmit={handleTaskSubmit}
                    isSubmitting={isSubmitting}
                />
            </motion.div>
        </AnimatePresence>
    )
}
