/**
 * Web Push Notification Utilities
 * Handles browser push notification subscription and management
 */

import { subscribeToPush, unsubscribeFromPush } from '@/lib/actions/notifications'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Get current push notification permission status
 */
export function getPushPermission(): NotificationPermission {
    return Notification.permission
}

/**
 * Request push notification permission and subscribe
 */
export async function requestPushPermission(): Promise<{
    success: boolean
    error?: string
}> {
    if (!isPushSupported()) {
        return { success: false, error: 'Push notifications are not supported' }
    }

    try {
        const permission = await Notification.requestPermission()

        if (permission !== 'granted') {
            return { success: false, error: 'Permission denied' }
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // Subscribe to push
        if (!VAPID_PUBLIC_KEY) {
            return { success: false, error: 'VAPID public key not configured' }
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        })

        // Save subscription to backend
        const subscriptionData = subscription.toJSON()
        const result = await subscribeToPush({
            endpoint: subscriptionData.endpoint!,
            keys: {
                p256dh: subscriptionData.keys!.p256dh!,
                auth: subscriptionData.keys!.auth!,
            },
        })

        if (!result.success) {
            return { success: false, error: result.error }
        }

        return { success: true }
    } catch (error) {
        console.error('Error requesting push permission:', error)
        return { success: false, error: 'Failed to subscribe to push notifications' }
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribePush(): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            await subscription.unsubscribe()

            // Remove from backend
            const subscriptionData = subscription.toJSON()
            await unsubscribeFromPush(subscriptionData.endpoint!)
        }

        return { success: true }
    } catch (error) {
        console.error('Error unsubscribing from push:', error)
        return { success: false, error: 'Failed to unsubscribe' }
    }
}

/**
 * Check if user is currently subscribed to push
 */
export async function isPushSubscribed(): Promise<boolean> {
    if (!isPushSupported()) {
        return false
    }

    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        return subscription !== null
    } catch (error) {
        console.error('Error checking push subscription:', error)
        return false
    }
}

/**
 * Test push notification (for debugging)
 */
export async function testPushNotification(): Promise<void> {
    if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
            body: 'This is a test notification from Mentra',
            icon: '/icon-192.png',
        })
    }
}
