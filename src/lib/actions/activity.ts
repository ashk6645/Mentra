'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

/**
 * Get dates where user had activity (completed tasks or habits)
 * Returns array of dates for the last 90 days
 */
export async function getActivityDates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, dates: [] }
    }

    try {
        const today = new Date()
        const ninetyDaysAgo = subDays(today, 90)

        // Get dates with completed tasks
        const completedTasks = await prisma.task.findMany({
            where: {
                userId: user.id,
                completed: true,
                completedAt: {
                    gte: ninetyDaysAgo,
                },
            },
            select: {
                completedAt: true,
            },
        })

        // Get dates with habit completions
        const habitCompletions = await prisma.habitCompletion.findMany({
            where: {
                habit: {
                    userId: user.id,
                },
                completedAt: {
                    gte: ninetyDaysAgo,
                },
            },
            select: {
                completedAt: true,
            },
        })

        // Combine and deduplicate dates (normalize to start of day)
        const activityDates = new Set<string>()

        completedTasks.forEach(task => {
            if (task.completedAt) {
                const dateStr = startOfDay(new Date(task.completedAt)).toISOString()
                activityDates.add(dateStr)
            }
        })

        habitCompletions.forEach(completion => {
            const dateStr = startOfDay(new Date(completion.completedAt)).toISOString()
            activityDates.add(dateStr)
        })

        // Convert to array of Date objects
        const dates = Array.from(activityDates).map(dateStr => new Date(dateStr))

        return { success: true, dates }
    } catch (error) {
        console.error('Error fetching activity dates:', error)
        return { success: false, dates: [] }
    }
}

/**
 * Get current streak information
 */
export async function getStreakInfo() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, currentStreak: 0, longestStreak: 0 }
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: {
                currentStreak: true,
                longestStreak: true,
            },
        })

        return {
            success: true,
            currentStreak: profile?.currentStreak || 0,
            longestStreak: profile?.longestStreak || 0,
        }
    } catch (error) {
        console.error('Error fetching streak info:', error)
        return { success: false, currentStreak: 0, longestStreak: 0 }
    }
}
