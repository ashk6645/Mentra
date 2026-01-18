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
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: [] }
        }

        const habits = await prisma.habit.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                userId: true,
                name: true,
                frequency: true,
                currentStreak: true,
                bestStreak: true,
                createdAt: true,
                updatedAt: true,
                completions: {
                    select: {
                        id: true,
                        completedAt: true,
                    },
                    orderBy: { completedAt: 'desc' },
                    take: 30 // Last 30 completions
                }
            },
            orderBy: { createdAt: 'asc' }
        })
        
        return habits
    } catch (error) {
        console.error('Failed to fetch habits:', error)
        return { success: false, error: 'Failed to fetch habits', data: [] }
    }
}

export async function createHabit(data: z.infer<typeof habitSchema>) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const validation = habitSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: validation.error.flatten().fieldErrors }
        }

        const trimmedName = validation.data.name.trim()
        if (trimmedName.length === 0) {
            return { success: false, error: 'Habit name cannot be empty' }
        }

        if (trimmedName.length > 100) {
            return { success: false, error: 'Habit name must be less than 100 characters' }
        }

        const habit = await prisma.habit.create({
            data: {
                userId: user.id,
                name: trimmedName,
                frequency: validation.data.frequency
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
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (!habitId || typeof habitId !== 'string') {
            return { success: false, error: 'Invalid habit ID' }
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Verify habit ownership
            const habit = await tx.habit.findUnique({
                where: { id: habitId },
                select: {
                    id: true,
                    userId: true,
                    streakCount: true,
                    lastCompletedAt: true,
                }
            })

            if (!habit) {
                throw new Error('Habit not found')
            }

            if (habit.userId !== user.id) {
                throw new Error('Unauthorized')
            }

            // Check if already completed today
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            const existingCompletion = await tx.habitCompletion.findFirst({
                where: {
                    habitId,
                    completedAt: { gte: today }
                },
                select: { id: true }
            })

            if (existingCompletion) {
                throw new Error('Already completed today')
            }

            // Create completion
            await tx.habitCompletion.create({
                data: { habitId }
            })

            // Calculate streak
            let newStreak = 1
            if (habit.lastCompletedAt) {
                const lastCompleted = new Date(
                    habit.lastCompletedAt.getFullYear(),
                    habit.lastCompletedAt.getMonth(),
                    habit.lastCompletedAt.getDate()
                )
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)

                // Continue streak if completed yesterday
                if (lastCompleted.getTime() === yesterday.getTime()) {
                    newStreak = habit.streakCount + 1
                }
            }

            // Update habit
            const updatedHabit = await tx.habit.update({
                where: { id: habitId },
                data: {
                    streakCount: newStreak,
                    lastCompletedAt: now
                }
            })

            return updatedHabit
        })

        revalidatePath('/habits')
        return { success: true, data: result }
    } catch (error: any) {
        console.error('Failed to complete habit:', error)
        
        if (error.message === 'Already completed today') {
            return { success: false, error: 'Already completed today' }
        }
        if (error.message === 'Habit not found') {
            return { success: false, error: 'Habit not found' }
        }
        if (error.message === 'Unauthorized') {
            return { success: false, error: 'Unauthorized' }
        }
        
        return { success: false, error: 'Failed to complete habit' }
    }
}

export async function deleteHabit(habitId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        if (!habitId || typeof habitId !== 'string') {
            return { success: false, error: 'Invalid habit ID' }
        }

        // Delete habit (cascade deletes completions)
        await prisma.habit.delete({
            where: { id: habitId, userId: user.id }
        })

        revalidatePath('/habits')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to delete habit:', error)
        
        if (error.code === 'P2025') {
            return { success: false, error: 'Habit not found or access denied' }
        }
        
        return { success: false, error: 'Failed to delete habit' }
    }
}
