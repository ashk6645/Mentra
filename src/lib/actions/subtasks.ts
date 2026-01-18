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
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const result = createSubTaskSchema.safeParse(data)

        if (!result.success) {
            return { success: false, error: result.error.flatten().fieldErrors }
        }

        const trimmedTitle = result.data.title.trim()
        if (trimmedTitle.length === 0) {
            return { success: false, error: 'Subtask title cannot be empty' }
        }

        if (trimmedTitle.length > 200) {
            return { success: false, error: 'Subtask title must be less than 200 characters' }
        }

        // Verify parent task belongs to user
        const parentTask = await prisma.task.findUnique({
            where: { id: result.data.parentTaskId, userId: user.id },
            select: { id: true, projectId: true }
        })

        if (!parentTask) {
            return { success: false, error: 'Parent task not found or access denied' }
        }

        const subTask = await prisma.task.create({
            data: {
                userId: user.id,
                parentTaskId: result.data.parentTaskId,
                title: trimmedTitle,
                description: result.data.description || null,
                priority: result.data.priority,
                dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
                projectId: parentTask.projectId, // Inherit project
                completed: false
            },
        })

        revalidatePath('/', 'layout')

        return { success: true, data: subTask }
    } catch (error: any) {
        console.error('Failed to create subtask:', error)
        
        if (error.code === 'P2003') {
            return { success: false, error: 'Invalid parent task' }
        }
        
        return { success: false, error: 'Failed to create subtask' }
    }
}

export async function getSubTasks(parentTaskId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: [] }
        }

        if (!parentTaskId || typeof parentTaskId !== 'string') {
            return { success: false, error: 'Invalid parent task ID', data: [] }
        }

        const subTasks = await prisma.task.findMany({
            where: {
                userId: user.id,
                parentTaskId: parentTaskId
            },
            select: {
                id: true,
                title: true,
                description: true,
                completed: true,
                priority: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        return { success: true, data: subTasks }
    } catch (error) {
        console.error('Failed to fetch subtasks:', error)
        return { success: false, error: 'Failed to fetch subtasks', data: [] }
    }
}
