'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateLevel, xpProgressInCurrentLevel, XP_STREAK_BONUS } from '@/lib/xp-utils'

export async function awardXP(action: string, points: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        // Log the XP gain
        await prisma.xPLog.create({
            data: {
                userId: user.id,
                source: 'task',
                amount: points
            }
        })

        // Update user's total XP
        const profile = await prisma.profile.update({
            where: { id: user.id },
            data: {
                totalXp: { increment: points }
            }
        })

        // Calculate and update level if changed
        const newLevel = calculateLevel(profile.totalXp)
        if (newLevel !== profile.level) {
            await prisma.profile.update({
                where: { id: user.id },
                data: { level: newLevel }
            })
        }

        return { xp: profile.totalXp, level: newLevel }
    } catch (error) {
        console.error('Failed to award XP:', error)
        return null
    }
}

export async function getUserStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: {
                totalXp: true,
                level: true,
                currentStreak: true,
                updatedAt: true
            }
        })

        if (!profile) return null

        const progress = xpProgressInCurrentLevel(profile.totalXp)

        return {
            xp: profile.totalXp,
            level: profile.level,
            streakCount: profile.currentStreak,
            lastActiveAt: profile.updatedAt,
            xpProgress: progress
        }
    } catch (error) {
        console.error('Failed to get user stats:', error)
        return null
    }
}

export async function updateStreak() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { currentStreak: true, longestStreak: true, updatedAt: true }
        })

        if (!profile) return null

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
                // Same day, no change
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
            }
        })

        // Award streak bonus XP if applicable
        if (streakBonus && newStreakCount > 1) {
            await awardXP('STREAK_BONUS', XP_STREAK_BONUS)
        }

        return { streakCount: newStreakCount, streakBonus }
    } catch (error) {
        console.error('Failed to update streak:', error)
        return null
    }
}
