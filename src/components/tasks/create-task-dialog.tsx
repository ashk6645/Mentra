'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createTask } from '@/lib/actions/tasks'
import { getProjects } from '@/lib/actions/projects'
import { getTags } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import { Project, Tag } from '@prisma/client'
import { TaskEditor } from './task-editor'

interface CreateTaskDialogProps {
    projectId?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultStatus?: string
    onTaskCreated?: (task: any) => void
    trigger?: React.ReactNode
}

export function CreateTaskDialog({
    projectId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    defaultStatus,
    onTaskCreated,
    trigger
}: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    const setOpen = (newOpen: boolean) => {
        if (controlledOnOpenChange) {
            controlledOnOpenChange(newOpen)
        } else {
            setInternalOpen(newOpen)
        }
    }

    const [projects, setProjects] = useState<Project[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if (open) {
            getProjects().then(setProjects)
            getTags().then(setTags)
        }
    }, [open])

    async function handleTaskSubmit(data: {
        title: string
        description?: string
        dueDate?: Date
        priority?: 'low' | 'medium' | 'high' | 'urgent' | null
        projectId?: string
        tagIds?: string[]
        scheduledTime?: string
    }) {
        try {
            setIsSubmitting(true)

            // Handle scheduled time if present (Todoist editor separates date and time, 
            // but for now we might only get date from the picker, unless we enhance TaskEditor later)
            const result = await createTask({
                ...data, // spread the strict types
                priority: data.priority || undefined, // convert null to undefined for API if needed
                dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
                projectId: data.projectId,
                // Add default duration if scheduled time is present? 
                // For now keep it simple as per image.
            })

            if (result.success) {
                setOpen(false)
                router.refresh()
                if (onTaskCreated && result.data) {
                    onTaskCreated(result.data)
                }
            }
        } catch (e) {
            console.error('Task creation exception:', e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-transparent border-none shadow-none">
                {/* 
                    Using transparent/border-none dialog content because TaskEditor 
                    handles the "Card" look ourselves. 
                 */}
                <TaskEditor
                    projects={projects.map(p => ({ id: p.id, name: p.name }))}
                    availableTags={tags.map(t => ({ id: t.id, name: t.name }))}
                    defaultProjectId={projectId}
                    onCancel={() => setOpen(false)}
                    onSubmit={handleTaskSubmit}
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    )
}
