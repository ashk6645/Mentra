// Service Worker for Push Notifications
// This file handles push notification events

self.addEventListener('push', function (event) {
    if (!event.data) {
        return
    }

    const data = event.data.json()
    const title = data.title || 'Mentra Reminder'
    const options = {
        body: data.body || 'You have a task reminder',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
            url: data.url || '/',
            taskId: data.taskId,
        },
        actions: [
            {
                action: 'view',
                title: 'View Task',
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
            },
        ],
        requireInteraction: true,
        tag: data.taskId || 'reminder',
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    )
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    if (event.action === 'view' || !event.action) {
        const urlToOpen = event.notification.data.url

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(function (clientList) {
                    // Check if there's already a window open
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i]
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus()
                        }
                    }
                    // Open new window if none found
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen)
                    }
                })
        )
    }
})

self.addEventListener('notificationclose', function (event) {
    // Track notification dismissal if needed
    console.log('Notification closed:', event.notification.tag)
})
