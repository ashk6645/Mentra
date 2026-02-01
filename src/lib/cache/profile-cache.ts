'use server'

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

/**
 * Cached profile data to reduce database queries
 * Revalidates every hour or when profile is updated
 */
export const getCachedProfile = unstable_cache(
    async (userId: string) => {
        const profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                level: true,
                totalXp: true,
                currentStreak: true,
                longestStreak: true,
                createdAt: true,
                updatedAt: true,
            }
        })
        return profile
    },
    ['user-profile'],
    { revalidate: 3600 } // Cache for 1 hour
)

/**
 * Cached user stats for dashboard
 */
export const getCachedUserStats = unstable_cache(
    async (userId: string) => {
        const [profile, totalXP] = await Promise.all([
            prisma.profile.findUnique({
                where: { id: userId },
                select: {
                    displayName: true,
                    currentStreak: true,
                    level: true,
                    totalXp: true,
                }
            }),
            prisma.xPLog.aggregate({
                where: { userId },
                _sum: { amount: true }
            })
        ])

        return {
            profile,
            totalXP: totalXP._sum.amount || 0
        }
    },
    ['user-stats'],
    { revalidate: 300 } // Cache for 5 minutes
)
