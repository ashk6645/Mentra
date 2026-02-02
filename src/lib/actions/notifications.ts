'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updatePreferencesSchema = z.object({
    enablePush: z.boolean().optional(),
    enableEmail: z.boolean().optional(),
    quietHoursStart: z.number().min(0).max(23).nullable().optional(),
    quietHoursEnd: z.number().min(0).max(23).nullable().optional(),
    emailDigest: z.boolean().optional(),
    digestFrequency: z.enum(['daily', 'weekly']).nullable().optional(),
})

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        let preferences = await prisma.notificationPreferences.findUnique({
            where: { userId: user.id },
        })

        // Create default preferences if they don't exist
        if (!preferences) {
            preferences = await prisma.notificationPreferences.create({
                data: {
                    userId: user.id,
                    enablePush: true,
                    enableEmail: true,
                },
            })
        }

        return { success: true, data: preferences }
    } catch (error) {
        console.error('Error fetching notification preferences:', error)
        return { success: false, error: 'Failed to fetch preferences' }
    }
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(data: z.infer<typeof updatePreferencesSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const validated = updatePreferencesSchema.parse(data)

        const preferences = await prisma.notificationPreferences.upsert({
            where: { userId: user.id },
            update: validated,
            create: {
                userId: user.id,
                ...validated,
            },
        })

        revalidatePath('/settings')
        return { success: true, data: preferences }
    } catch (error) {
        console.error('Error updating notification preferences:', error)
        return { success: false, error: 'Failed to update preferences' }
    }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(subscription: {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

        const pushSubscription = await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent,
            },
            create: {
                userId: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent,
            },
        })

        return { success: true, data: pushSubscription }
    } catch (error) {
        console.error('Error subscribing to push:', error)
        return { success: false, error: 'Failed to subscribe to push notifications' }
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(endpoint: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                userId: user.id,
            },
        })

        return { success: true }
    } catch (error) {
        console.error('Error unsubscribing from push:', error)
        return { success: false, error: 'Failed to unsubscribe' }
    }
}

/**
 * Get user's push subscriptions
 */
export async function getPushSubscriptions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized', data: [] }
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                endpoint: true,
                userAgent: true,
                createdAt: true,
            },
        })

        return { success: true, data: subscriptions }
    } catch (error) {
        console.error('Error fetching push subscriptions:', error)
        return { success: false, error: 'Failed to fetch subscriptions', data: [] }
    }
}
