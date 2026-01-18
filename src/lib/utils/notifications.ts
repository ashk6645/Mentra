/**
 * Notification Utility Functions
 * Handles browser notifications with permission management
 */

export type NotificationPermission = 'granted' | 'denied' | 'default'

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission as NotificationPermission
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission as NotificationPermission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Show a browser notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions & {
    onClick?: () => void
  }
): Promise<Notification | null> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported')
    return null
  }

  const permission = getNotificationPermission()

  if (permission === 'denied') {
    console.warn('Notification permission denied')
    return null
  }

  if (permission === 'default') {
    const newPermission = await requestNotificationPermission()
    if (newPermission !== 'granted') {
      return null
    }
  }

  try {
    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    })

    if (options?.onClick) {
      notification.onclick = () => {
        window.focus()
        options.onClick?.()
        notification.close()
      }
    }

    return notification
  } catch (error) {
    console.error('Error showing notification:', error)
    return null
  }
}

/**
 * Show task reminder notification
 */
export function showTaskReminder(taskTitle: string, dueDate?: Date) {
  const body = dueDate
    ? `Due: ${dueDate.toLocaleString()}`
    : 'Don\'t forget to complete this task!'

  return showNotification(`📋 ${taskTitle}`, {
    body,
    tag: 'task-reminder',
    requireInteraction: true,
    onClick: () => {
      // Navigate to tasks page
      window.location.href = '/tasks'
    },
  })
}

/**
 * Show focus session complete notification
 */
export function showFocusComplete(sessionDuration: number) {
  return showNotification('🎯 Focus Session Complete!', {
    body: `Great job! You focused for ${sessionDuration} minutes.`,
    tag: 'focus-complete',
  })
}

/**
 * Show achievement notification
 */
export function showAchievement(title: string, description: string) {
  return showNotification(`🏆 ${title}`, {
    body: description,
    tag: 'achievement',
  })
}

/**
 * Show streak notification
 */
export function showStreakNotification(streakCount: number) {
  return showNotification(`🔥 ${streakCount} Day Streak!`, {
    body: 'Keep up the great work!',
    tag: 'streak',
  })
}
