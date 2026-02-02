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

        // Combine and deduplicate dates (normalize to start of day)
        const activityDates = new Set<string>()

        completedTasks.forEach(task => {
            if (task.completedAt) {
                const dateStr = startOfDay(new Date(task.completedAt)).toISOString()
                activityDates.add(dateStr)
            }
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

/**
 * Update user's activity streak
 * Called when user completes a task or habit
 */
export async function updateStreak() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: null }
        }

        // Ensure profile exists
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email!,
                displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            },
            select: { id: true }
        })

        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: {
                currentStreak: true,
                longestStreak: true,
                updatedAt: true
            }
        })

        if (!profile) {
            return { success: false, error: 'Profile not found', data: null }
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const lastActive = profile.updatedAt
            ? new Date(profile.updatedAt.getFullYear(), profile.updatedAt.getMonth(), profile.updatedAt.getDate())
            : null

        let newStreakCount = profile.currentStreak
        let streakBonus = false

        if (!lastActive) {
            // First activity ever
            newStreakCount = 1
        } else {
            const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === 0) {
                // Same day activity
                if (profile.currentStreak === 0) {
                    newStreakCount = 1
                } else {
                    // Already have a streak for today, no change
                    return {
                        success: true,
                        data: {
                            streakCount: newStreakCount,
                            streakBonus: false
                        }
                    }
                }
            } else if (diffDays === 1) {
                // Consecutive day - increment streak
                newStreakCount = profile.currentStreak + 1
                streakBonus = true
            } else {
                // Streak broken - reset to 1
                newStreakCount = 1
            }
        }

        // Update profile with atomic operations where possible
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                currentStreak: newStreakCount,
                // Atomic max operation: only update if new streak is longer
                longestStreak: newStreakCount > profile.longestStreak ? newStreakCount : profile.longestStreak,
                updatedAt: now
            },
            select: { id: true }
        })

        return {
            success: true,
            data: {
                streakCount: newStreakCount,
                streakBonus
            }
        }
    } catch (error) {
        console.error('Failed to update streak:', error)
        return { success: false, error: 'Failed to update streak', data: null }
    }
}
