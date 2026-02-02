/**
 * Overdue Task Notifications
 * Sends email notifications for tasks that are overdue
 */

import prisma from '@/lib/prisma'
import { sendReminderEmail } from './email'
import { addDays, isAfter } from 'date-fns'

/**
 * Process overdue tasks and send notifications
 * Should be run once per day
 */
export async function processOverdueTasks(): Promise<{
    processed: number
    sent: number
    errors: number
}> {
    const stats = { processed: 0, sent: 0, errors: 0 }
    const now = new Date()

    try {
        // Find tasks that are overdue and not completed
        const overdueTasks = await prisma.task.findMany({
            where: {
                completed: false,
                dueDate: {
                    lt: now,
                    // Only notify for tasks overdue within last 7 days (avoid spam)
                    gte: addDays(now, -7),
                },
            },
            include: {
                user: {
                    include: {
                        notificationPreferences: true,
                    },
                },
            },
        })

        for (const task of overdueTasks) {
            stats.processed++

            try {
                const user = task.user
                const prefs = user.notificationPreferences

                // Skip if user has email notifications disabled
                if (prefs && !prefs.enableEmail) {
                    continue
                }

                // Check if we've already sent an overdue notification today
                // (to avoid sending multiple emails per day for the same task)
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const existingNotification = await prisma.reminder.findFirst({
                    where: {
                        taskId: task.id,
                        isSent: true,
                        sentAt: {
                            gte: today,
                        },
                        sentVia: {
                            has: 'email',
                        },
                    },
                })

                if (existingNotification) {
                    continue // Already notified today
                }

                // Send overdue email
                const emailResult = await sendReminderEmail({
                    to: user.email,
                    userName: user.displayName || user.email.split('@')[0],
                    taskTitle: `⚠️ OVERDUE: ${task.title}`,
                    taskDescription: task.description || undefined,
                    dueDate: task.dueDate || undefined,
                    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tasks?selected=${task.id}`,
                })

                if (emailResult.success) {
                    // Create a reminder record to track that we sent this notification
                    await prisma.reminder.create({
                        data: {
                            taskId: task.id,
                            remindAt: now,
                            isSent: true,
                            sentAt: now,
                            sentVia: ['email'],
                        },
                    })
                    stats.sent++
                } else {
                    stats.errors++
                }
            } catch (err) {
                console.error(`Error processing overdue task ${task.id}:`, err)
                stats.errors++
            }
        }

        return stats
    } catch (error) {
        console.error('Error in processOverdueTasks:', error)
        throw error
    }
}
