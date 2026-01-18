'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const habitSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
})

export async function getHabits() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const habits = await prisma.habit.findMany({
            where: { userId: user.id },
            include: {
                completions: {
                    orderBy: { completedAt: 'desc' },
                    take: 30 // Last 30 completions
                }
            },
            orderBy: { createdAt: 'asc' }
        })
        return habits
    } catch (error) {
        console.error('Failed to fetch habits:', error)
        return []
    }
}

export async function createHabit(data: z.infer<typeof habitSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const validation = habitSchema.safeParse(data)
    if (!validation.success) {
        return { success: false, error: validation.error.format() }
    }

    try {
        const habit = await prisma.habit.create({
            data: {
                userId: user.id,
                name: data.name,
                frequency: data.frequency
            }
        })

        revalidatePath('/habits')
        return { success: true, data: habit }
    } catch (error) {
        console.error('Failed to create habit:', error)
        return { success: false, error: 'Failed to create habit' }
    }
}

export async function completeHabit(habitId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Check if already completed today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existingCompletion = await prisma.habitCompletion.findFirst({
            where: {
                habitId,
                completedAt: { gte: today }
            }
        })

        if (existingCompletion) {
            return { success: false, error: 'Already completed today' }
        }

        // Create completion
        await prisma.habitCompletion.create({
            data: { habitId }
        })

        // Update streak
        const habit = await prisma.habit.findUnique({
            where: { id: habitId }
        })

        if (habit) {
            const lastCompleted = habit.lastCompletedAt
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            let newStreak = 1
            if (lastCompleted && lastCompleted >= yesterday) {
                newStreak = habit.streakCount + 1
            }

            await prisma.habit.update({
                where: { id: habitId },
                data: {
                    streakCount: newStreak,
                    lastCompletedAt: new Date()
                }
            })
        }

        revalidatePath('/habits')
        return { success: true }
    } catch (error) {
        console.error('Failed to complete habit:', error)
        return { success: false, error: 'Failed to complete habit' }
    }
}

export async function deleteHabit(habitId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await prisma.habit.delete({
            where: { id: habitId, userId: user.id }
        })

        revalidatePath('/habits')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete habit:', error)
        return { success: false, error: 'Failed to delete habit' }
    }
}
