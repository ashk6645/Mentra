'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { Task } from '@prisma/client'
import { awardXP, updateStreak } from '@/lib/actions/gamification'

// Schemas
const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
    dueDate: z.string().optional().nullable(), // Passed as ISO string
    projectId: z.string().optional(),
    sectionId: z.string().optional(),
    scheduledStart: z.string().optional(), // ISO string for scheduled start time
    scheduledEnd: z.string().optional(), // ISO string for scheduled end time
    durationMinutes: z.number().optional(),
})

const updateTaskSchema = createTaskSchema.partial().extend({
    id: z.string(),
    completed: z.boolean().optional(),
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
        },
        include: {
            tags: {
                include: {
                    tag: true
                }
            }
        },
        orderBy: [
            { completed: 'asc' },
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
                priority: result.data.priority || null,
                dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
                projectId: result.data.projectId || null,
                sectionId: result.data.sectionId || null,
                scheduledStart: result.data.scheduledStart ? new Date(result.data.scheduledStart) : null,
                scheduledEnd: result.data.scheduledEnd ? new Date(result.data.scheduledEnd) : null,
                durationMinutes: result.data.durationMinutes || null,
            },
        })

        console.log('createTask: Success', task)
        revalidatePath('/')
        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        revalidatePath('/projects')
        revalidatePath('/calendar')
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
                completed: result.data.completed,
                projectId: result.data.projectId,
                sectionId: result.data.sectionId,
                scheduledStart: result.data.scheduledStart ? new Date(result.data.scheduledStart) : undefined,
                scheduledEnd: result.data.scheduledEnd ? new Date(result.data.scheduledEnd) : undefined,
                durationMinutes: result.data.durationMinutes,
            },
        })

        // Award XP if task was just completed
        if (result.data.completed === true) {
            await awardXP('TASK_COMPLETION', 10)
            await updateStreak()
        }

        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        revalidatePath('/calendar')
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

export async function toggleTaskCompletion(id: string, completed: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        await prisma.task.update({
            where: { id, userId: user.id },
            data: {
                completed,
                completedAt: completed ? new Date() : null,
            }
        })

        // Award XP and update streak if task was just completed
        if (completed) {
            await awardXP('TASK_COMPLETION', 10)
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
