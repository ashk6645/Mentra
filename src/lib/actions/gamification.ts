'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateLevel, xpProgressInCurrentLevel, XP_STREAK_BONUS } from '@/lib/xp-utils'

export async function awardXP(action: string, points: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: null }
        }

        // Validate points
        if (typeof points !== 'number' || points <= 0 || points > 10000) {
            console.error('Invalid XP amount:', points)
            return { success: false, error: 'Invalid XP amount', data: null }
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
            select: { id: true } // Minimal select
        })

        // Log the XP gain
        await prisma.xPLog.create({
            data: {
                userId: user.id,
                source: action.substring(0, 50), // Limit length
                amount: Math.floor(points)
            }
        })

        // Update user's total XP
        const profile = await prisma.profile.update({
            where: { id: user.id },
            data: {
                totalXp: { increment: Math.floor(points) }
            },
            select: {
                totalXp: true,
                level: true,
            }
        })

        // Calculate and update level if changed
        const newLevel = calculateLevel(profile.totalXp)
        if (newLevel !== profile.level) {
            await prisma.profile.update({
                where: { id: user.id },
                data: { level: newLevel },
                select: { id: true }
            })
        }

        return { success: true, data: { xp: profile.totalXp, level: newLevel } }
    } catch (error) {
        console.error('Failed to award XP:', error)
        return { success: false, error: 'Failed to award XP', data: null }
    }
}

export async function getUserStats() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized', data: null }
        }

        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: {
                totalXp: true,
                level: true,
                currentStreak: true,
                longestStreak: true,
                updatedAt: true
            }
        })

        if (!profile) {
            return { success: false, error: 'Profile not found', data: null }
        }

        const progress = xpProgressInCurrentLevel(profile.totalXp)

        return {
            success: true,
            data: {
                xp: profile.totalXp,
                level: profile.level,
                streakCount: profile.currentStreak,
                longestStreak: profile.longestStreak,
                lastActiveAt: profile.updatedAt,
                xpProgress: progress
            }
        }
    } catch (error) {
        console.error('Failed to get user stats:', error)
        return { success: false, error: 'Failed to get user stats', data: null }
    }
}

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

                // CRITICAL FIX: If streak is 0 (e.g. new profile or just reset), 
                // we treat this as the first activity to start the streak.
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

        // Update profile
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                currentStreak: newStreakCount,
                longestStreak: Math.max(newStreakCount, profile.longestStreak),
                updatedAt: now
            },
            select: { id: true }
        })

        // Award streak bonus XP if applicable (prevent recursion by checking streak count)
        if (streakBonus && newStreakCount > 1 && newStreakCount % 7 === 0) {
            // Only award bonus every 7 days to prevent spam
            await awardXP('STREAK_BONUS', XP_STREAK_BONUS)
        }

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
