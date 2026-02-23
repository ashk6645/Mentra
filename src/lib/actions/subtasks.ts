'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Subtask } from '@prisma/client'
import { ApiResponse } from '@/types'

export async function createSubtask(taskId: string, title: string): Promise<ApiResponse<Subtask>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify task ownership
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { userId: true }
        })

        if (!task || task.userId !== user.id) {
            return { success: false, error: 'Task not found or unauthorized' }
        }

        const subtask = await prisma.subtask.create({
            data: {
                taskId,
                title,
                sortOrder: await prisma.subtask.count({ where: { taskId } }) // Append to end
            }
        })

        revalidatePath('/tasks')
        revalidatePath(`/task/${taskId}`) // If we have individual task pages

        return { success: true, data: subtask }
    } catch (error) {
        console.error('Error creating subtask:', error)
        return { success: false, error: 'Failed to create subtask' }
    }
}

export async function updateSubtask(id: string, updates: Partial<Subtask>): Promise<ApiResponse<Subtask>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify ownership via Task relation
        const subtask = await prisma.subtask.findUnique({
            where: { id },
            include: { task: true }
        })

        if (!subtask || subtask.task.userId !== user.id) {
            return { success: false, error: 'Subtask not found or unauthorized' }
        }

        const updatedSubtask = await prisma.subtask.update({
            where: { id },
            data: updates
        })

        revalidatePath('/tasks')
        return { success: true, data: updatedSubtask }
    } catch (error) {
        console.error('Error updating subtask:', error)
        return { success: false, error: 'Failed to update subtask' }
    }
}

export async function deleteSubtask(id: string): Promise<ApiResponse<boolean>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify ownership via Task relation
        const subtask = await prisma.subtask.findUnique({
            where: { id },
            include: { task: true }
        })

        if (!subtask || subtask.task.userId !== user.id) {
            return { success: false, error: 'Subtask not found or unauthorized' }
        }

        await prisma.subtask.delete({
            where: { id }
        })

        revalidatePath('/tasks')
        return { success: true, data: true }
    } catch (error) {
        console.error('Error deleting subtask:', error)
        return { success: false, error: 'Failed to delete subtask' }
    }
}

export async function reorderSubtasks(taskId: string, orderedSubtaskIds: string[]): Promise<ApiResponse<boolean>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify task ownership
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { userId: true }
        })

        if (!task || task.userId !== user.id) {
            return { success: false, error: 'Task not found or unauthorized' }
        }

        // Run transaction to update all sortOrders
        await prisma.$transaction(
            orderedSubtaskIds.map((id, index) =>
                prisma.subtask.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        )

        revalidatePath('/tasks')
        revalidatePath(`/task/${taskId}`)

        return { success: true, data: true }
    } catch (error) {
        console.error('Error reordering subtasks:', error)
        return { success: false, error: 'Failed to reorder subtasks' }
    }
}

