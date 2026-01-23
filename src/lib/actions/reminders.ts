'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createReminderSchema = z.object({
    taskId: z.string(),
    remindAt: z.date(),
})

/**
 * Create a reminder for a task
 */
export async function createReminder(taskId: string, remindAt: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    try {
        // Verify task belongs to user
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId: user.id,
            },
        })

        if (!task) {
            throw new Error('Task not found')
        }

        const reminder = await prisma.reminder.create({
            data: {
                taskId,
                remindAt,
            },
        })

        revalidatePath('/tasks')
        return { success: true, reminder }
    } catch (error) {
        console.error('Error creating reminder:', error)
        return { success: false, error: 'Failed to create reminder' }
    }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(reminderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    try {
        // Verify reminder belongs to user's task
        const reminder = await prisma.reminder.findFirst({
            where: {
                id: reminderId,
            },
            include: {
                task: true,
            },
        })

        if (!reminder || reminder.task.userId !== user.id) {
            throw new Error('Reminder not found')
        }

        await prisma.reminder.delete({
            where: {
                id: reminderId,
            },
        })

        revalidatePath('/tasks')
        return { success: true }
    } catch (error) {
        console.error('Error deleting reminder:', error)
        return { success: false, error: 'Failed to delete reminder' }
    }
}

/**
 * Get reminders for a task
 */
export async function getTaskReminders(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    try {
        const reminders = await prisma.reminder.findMany({
            where: {
                taskId,
                task: {
                    userId: user.id,
                },
            },
            orderBy: {
                remindAt: 'asc',
            },
        })

        return { success: true, reminders }
    } catch (error) {
        console.error('Error fetching reminders:', error)
        return { success: false, error: 'Failed to fetch reminders', reminders: [] }
    }
}
