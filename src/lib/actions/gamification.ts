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
                action,
                points
            }
        })

        // Update user's total XP
        const profile = await prisma.profile.update({
            where: { id: user.id },
            data: {
                xp: { increment: points }
            }
        })

        // Calculate and update level if changed
        const newLevel = calculateLevel(profile.xp)
        if (newLevel !== profile.level) {
            await prisma.profile.update({
                where: { id: user.id },
                data: { level: newLevel }
            })
        }

        return { xp: profile.xp, level: newLevel }
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
                xp: true,
                level: true,
                streakCount: true,
                lastActiveAt: true
            }
        })

        if (!profile) return null

        const progress = xpProgressInCurrentLevel(profile.xp)

        return {
            xp: profile.xp,
            level: profile.level,
            streakCount: profile.streakCount,
            lastActiveAt: profile.lastActiveAt,
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
            select: { streakCount: true, lastActiveAt: true }
        })

        if (!profile) return null

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const lastActive = profile.lastActiveAt
            ? new Date(profile.lastActiveAt.getFullYear(), profile.lastActiveAt.getMonth(), profile.lastActiveAt.getDate())
            : null

        let newStreakCount = profile.streakCount
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
                newStreakCount = profile.streakCount + 1
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
                streakCount: newStreakCount,
                lastActiveAt: now
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
