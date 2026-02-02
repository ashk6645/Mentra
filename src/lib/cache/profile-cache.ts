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
        const profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: {
                displayName: true,
                currentStreak: true,
                longestStreak: true,
            }
        })

        return {
            profile
        }
    },
    ['user-stats'],
    { revalidate: 300 } // Cache for 5 minutes
)
