'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createTask } from '@/lib/actions/tasks'
import { getProjects } from '@/lib/actions/projects'
import { getTags } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import { Tag } from '@prisma/client'
import { TaskEditor } from './task-editor'
import { showErrorToast, showSuccessToast } from '@/lib/error-handler'
import { InlineLoader } from '@/components/shared/loading-spinner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CreateTaskInlineProps {
    projectId?: string
    defaultStatus?: string
    defaultSectionId?: string
    onTaskCreated?: (task: any) => void
    trigger?: React.ReactNode
    className?: string
}

export function CreateTaskInline({
    projectId,
    defaultStatus,
    defaultSectionId,
    onTaskCreated,
    trigger,
    className
}: CreateTaskInlineProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [projects, setProjects] = useState<Array<{
        id: string
        name: string
        color: string | null
        icon: string | null
        sortOrder: number
    }>>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if (isExpanded) {
            setIsLoadingData(true)
            Promise.all([getProjects(), getTags()])
                .then(([projectsData, tagsData]) => {
                    setProjects(projectsData)
                    setTags(tagsData)
                })
                .catch((error) => {
                    showErrorToast(error, 'Failed to load projects and tags')
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
        projectId?: string
        tagIds?: string[]
        scheduledTime?: string
        sectionId?: string
    }) {
        try {
            setIsSubmitting(true)

            const result = await createTask({
                ...data,
                priority: data.priority || undefined,
                dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
                projectId: data.projectId,
                sectionId: data.sectionId || defaultSectionId,
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
            <div className={cn("w-full transition-all duration-300", className)}>
                <div onClick={() => setIsExpanded(true)}>
                    {trigger ? (
                        trigger
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground pl-2"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add task...
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn("w-full overflow-hidden", className)}
            >
                <TaskEditor
                    projects={projects.map(p => ({ id: p.id, name: p.name }))}
                    availableTags={tags.map(t => ({ id: t.id, name: t.name }))}
                    defaultProjectId={projectId}
                    onCancel={() => setIsExpanded(false)}
                    onSubmit={handleTaskSubmit}
                    isSubmitting={isSubmitting}
                />
            </motion.div>
        </AnimatePresence>
    )
}
