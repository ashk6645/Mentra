/**
 * Server-side push notification sending
 * Uses web-push library to send notifications to subscribed devices
 */

import webpush from 'web-push'
import prisma from '@/lib/prisma'

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:notifications@mentra.app'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    )
}

export interface PushPayload {
    title: string
    body: string
    url?: string
    taskId?: string
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{
    success: boolean
    sentCount: number
    errors: string[]
}> {
    try {
        // Get all push subscriptions for this user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        })

        if (subscriptions.length === 0) {
            return { success: true, sentCount: 0, errors: [] }
        }

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                }

                try {
                    await webpush.sendNotification(
                        pushSubscription,
                        JSON.stringify(payload)
                    )
                    return { success: true, endpoint: sub.endpoint }
                } catch (error: any) {
                    // If subscription is invalid (410 Gone), remove it
                    if (error.statusCode === 410) {
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id },
                        })
                    }
                    throw error
                }
            })
        )

        const sentCount = results.filter(r => r.status === 'fulfilled').length
        const errors = results
            .filter(r => r.status === 'rejected')
            .map(r => (r as PromiseRejectedResult).reason.message)

        return {
            success: sentCount > 0,
            sentCount,
            errors,
        }
    } catch (error) {
        console.error('Error sending push notifications:', error)
        return {
            success: false,
            sentCount: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        }
    }
}

/**
 * Send push notification for a task reminder
 */
export async function sendReminderPush(
    userId: string,
    taskTitle: string,
    taskId: string
): Promise<{ success: boolean; sentCount: number }> {
    const payload: PushPayload = {
        title: '⏰ Task Reminder',
        body: taskTitle,
        url: `/tasks?selected=${taskId}`,
        taskId,
    }

    const result = await sendPushToUser(userId, payload)
    return { success: result.success, sentCount: result.sentCount }
}
