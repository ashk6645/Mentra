'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { Priority } from '@prisma/client'

const createSubTaskSchema = z.object({
    parentTaskId: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.nativeEnum(Priority).optional().default(Priority.NONE),
    dueDate: z.string().optional(), // ISO String
})

export async function createSubTask(data: z.infer<typeof createSubTaskSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = createSubTaskSchema.safeParse(data)

    if (!result.success) {
        return { error: result.error.flatten() }
    }

    try {
        // Verify parent task belongs to user
        const parentTask = await prisma.task.findUnique({
            where: { id: result.data.parentTaskId, userId: user.id }
        })

        if (!parentTask) {
            return { error: 'Parent task not found' }
        }

        const subTask = await prisma.task.create({
            data: {
                userId: user.id,
                parentTaskId: result.data.parentTaskId,
                title: result.data.title,
                description: result.data.description,
                priority: result.data.priority,
                dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
                projectId: parentTask.projectId, // Inherit project
                isCompleted: false
            },
        })

        revalidatePath('/tasks')
        revalidatePath('/projects')
        revalidatePath('/dashboard')
        revalidatePath('/today')
        revalidatePath('/upcoming')

        return { success: true, data: subTask }
    } catch (error) {
        return { error: 'Failed to create subtask' }
    }
}

export async function getSubTasks(parentTaskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const subTasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            parentTaskId: parentTaskId
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    return subTasks
}
