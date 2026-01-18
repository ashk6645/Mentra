'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { Priority, Task } from '@prisma/client'
import { awardXP, updateStreak } from '@/lib/actions/gamification'

import { RRule } from 'rrule'

// Schemas
const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.nativeEnum(Priority).default('NONE'),
    dueDate: z.string().optional().nullable(), // Passed as ISO string
    projectId: z.string().optional(),
    sectionId: z.string().optional(),
    parentId: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceRule: z.string().optional(),
})

const updateTaskSchema = createTaskSchema.partial().extend({
    id: z.string(),
    isCompleted: z.boolean().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

// Actions

export async function getTasks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const tasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            parentTaskId: null // Only fetch top-level tasks
        },
        include: {
            subTasks: {
                orderBy: [
                    { isCompleted: 'asc' },
                    { sortOrder: 'asc' }
                ],
                include: {
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            },
            tags: {
                include: {
                    tag: true
                }
            }
        },
        orderBy: [
            { isCompleted: 'asc' },
            { sortOrder: 'asc' },
            { createdAt: 'desc' }
        ]
    })

    return tasks
}

export async function createTask(data: CreateTaskInput) {
    console.log('createTask called with:', data)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('createTask: Unauthorized')
        return { success: false, error: 'Unauthorized' }
    }

    const result = createTaskSchema.safeParse(data)

    if (!result.success) {
        console.error('createTask: Validation failed', result.error)
        return { success: false, error: result.error.flatten() }
    }

    try {
        // Ensure profile exists before creating task
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email!,
                displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            }
        })

        const task = await prisma.task.create({
            data: {
                userId: user.id,
                title: result.data.title,
                description: result.data.description,
                priority: result.data.priority,
                dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
                projectId: result.data.projectId || null,
                sectionId: result.data.sectionId || null,
                parentTaskId: result.data.parentId || null,
                isRecurring: result.data.isRecurring ?? false,
                recurrenceRule: result.data.recurrenceRule,
            },
        })

        console.log('createTask: Success', task)
        revalidatePath('/')
        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        revalidatePath('/projects')
        return { success: true, data: task }
    } catch (error) {
        console.error('createTask: Database error', error)
        return { success: false, error: 'Failed to create task' }
    }
}

export async function updateTask(data: UpdateTaskInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = updateTaskSchema.safeParse(data)

    if (!result.success) {
        return { error: result.error.flatten() }
    }

    try {
        const task = await prisma.task.update({
            where: {
                id: result.data.id,
                userId: user.id // Ensure ownership
            },
            data: {
                title: result.data.title,
                description: result.data.description,
                priority: result.data.priority,
                dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
                isCompleted: result.data.isCompleted,
                projectId: result.data.projectId,
                sectionId: result.data.sectionId,
                isRecurring: result.data.isRecurring,
                recurrenceRule: result.data.recurrenceRule,
            },
        })

        // Award XP if task was just completed
        if (result.data.isCompleted === true) {
            const isSubtask = !!task.parentTaskId
            await awardXP(isSubtask ? 'SUBTASK_COMPLETION' : 'TASK_COMPLETION', isSubtask ? 5 : 10)
            await updateStreak()
        }

        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        return { success: true, data: task }
    } catch (error) {
        return { error: 'Failed to update task' }
    }
}

export async function updateTaskOrder(tasks: { id: string; sortOrder: number; sectionId?: string | null }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        await prisma.$transaction(
            tasks.map(task =>
                prisma.task.update({
                    where: { id: task.id, userId: user.id },
                    data: {
                        sortOrder: task.sortOrder,
                        sectionId: task.sectionId
                    }
                })
            )
        )
        revalidatePath('/tasks')
        revalidatePath('/projects/[id]', 'page')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to update task order' }
    }
}

export async function toggleTaskCompletion(id: string, isCompleted: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        // Fetch existing task to check recurrence
        const existingTask = await prisma.task.findUnique({
            where: { id, userId: user.id },
            include: { tags: { include: { tag: true } } } // Include tags to copy them
        })

        if (!existingTask) return { error: 'Task not found' }

        // If completing a recurring task
        if (isCompleted && existingTask.isRecurring && existingTask.recurrenceRule) {
            try {
                const rule = RRule.fromString(existingTask.recurrenceRule)
                const nextDate = rule.after(new Date(), true) // Get next occurrence after today (inc today?) - usually strict after

                if (nextDate) {
                    // Create next task instance
                    await prisma.task.create({
                        data: {
                            userId: user.id,
                            title: existingTask.title,
                            description: existingTask.description,
                            priority: existingTask.priority,
                            projectId: existingTask.projectId,
                            sectionId: existingTask.sectionId,
                            parentTaskId: existingTask.parentTaskId,
                            isRecurring: true,
                            recurrenceRule: existingTask.recurrenceRule,
                            dueDate: nextDate,
                            // Map tags manually since we can't directly copy relation
                            tags: {
                                create: existingTask.tags.map(t => ({
                                    tag: { connect: { id: t.tag.id } }
                                }))
                            }
                        }
                    })
                }
            } catch (e) {
                console.error("Error processing recurrence", e)
            }
        }

        await prisma.task.update({
            where: { id, userId: user.id },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
                // Optionally stop recurrence on completed task if we want to "archive" the rule?
                // For now, let's leave it. Logic above handles "next" creation.
            }
        })

        // Award XP and update streak if task was just completed
        if (isCompleted) {
            const isSubtask = !!existingTask.parentTaskId
            await awardXP(isSubtask ? 'SUBTASK_COMPLETION' : 'TASK_COMPLETION', isSubtask ? 5 : 10)
            await updateStreak()
        }

        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to toggle task' }
    }
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        await prisma.task.delete({
            where: { id, userId: user.id }
        })
        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete task' }
    }
}

export async function searchTasks(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    if (!query || query.length < 2) return []

    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: user.id,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                project: true // Include project info for context
            }
        })
        return tasks
    } catch (error) {
        console.error("Search failed", error)
        return []
    }
}
