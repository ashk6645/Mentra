/**
 * Notification Processor
 * Core logic for processing pending reminders and delivering notifications
 */

import prisma from '@/lib/prisma'
import { sendReminderPush } from './send-push'
import { sendReminderEmail } from './email'
import { isWithinInterval, addHours } from 'date-fns'

/**
 * Check if current time is within user's quiet hours
 */
function isQuietHours(quietStart: number | null, quietEnd: number | null): boolean {
    if (quietStart === null || quietEnd === null) {
        return false
    }

    const now = new Date()
    const currentHour = now.getHours()

    // Handle cases where quiet hours span midnight
    if (quietStart < quietEnd) {
        return currentHour >= quietStart && currentHour < quietEnd
    } else {
        return currentHour >= quietStart || currentHour < quietEnd
    }
}

/**
 * Process all pending reminders
 */
export async function processPendingReminders(): Promise<{
    processed: number
    sent: number
    errors: number
}> {
    const now = new Date()
    const stats = { processed: 0, sent: 0, errors: 0 }

    try {
        // Find all reminders that are due and haven't been sent
        const pendingReminders = await prisma.reminder.findMany({
            where: {
                remindAt: {
                    lte: now,
                },
                isSent: false,
            },
            include: {
                task: {
                    include: {
                        user: {
                            include: {
                                notificationPreferences: true,
                            },
                        },
                    },
                },
            },
            take: 100, // Process in batches
        })

        for (const reminder of pendingReminders) {
            stats.processed++

            try {
                const task = reminder.task
                const user = task.user
                const prefs = user.notificationPreferences

                // Skip if task is already completed
                if (task.completed) {
                    await markReminderSent(reminder.id, [], 'Task already completed')
                    continue
                }

                // Check quiet hours
                if (prefs && isQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
                    // Reschedule for after quiet hours
                    const quietEnd = prefs.quietHoursEnd!
                    const nextRemindAt = new Date(now)
                    nextRemindAt.setHours(quietEnd, 0, 0, 0)

                    if (nextRemindAt <= now) {
                        nextRemindAt.setDate(nextRemindAt.getDate() + 1)
                    }

                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: { remindAt: nextRemindAt },
                    })
                    continue
                }

                const sentVia: string[] = []
                let error: string | null = null

                // Send push notification
                if (!prefs || prefs.enablePush) {
                    try {
                        const pushResult = await sendReminderPush(
                            user.id,
                            task.title,
                            task.id
                        )
                        if (pushResult.success && pushResult.sentCount > 0) {
                            sentVia.push('push')
                        }
                    } catch (err) {
                        console.error('Push notification error:', err)
                        error = err instanceof Error ? err.message : 'Push failed'
                    }
                }

                // Send email notification
                if (!prefs || prefs.enableEmail) {
                    // Skip email if digest is enabled (will be sent in batch)
                    if (!prefs?.emailDigest) {
                        try {
                            const emailResult = await sendReminderEmail({
                                to: user.email,
                                userName: user.displayName || user.email.split('@')[0],
                                taskTitle: task.title,
                                taskDescription: task.description || undefined,
                                dueDate: task.dueDate || undefined,
                                taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tasks?selected=${task.id}`,
                            })
                            if (emailResult.success) {
                                sentVia.push('email')
                            } else {
                                error = emailResult.error || 'Email failed'
                            }
                        } catch (err) {
                            console.error('Email notification error:', err)
                            error = err instanceof Error ? err.message : 'Email failed'
                        }
                    }
                }

                // Mark reminder as sent
                await markReminderSent(reminder.id, sentVia, error)

                if (sentVia.length > 0) {
                    stats.sent++
                }
            } catch (err) {
                console.error(`Error processing reminder ${reminder.id}:`, err)
                stats.errors++

                // Mark with error
                await markReminderSent(
                    reminder.id,
                    [],
                    err instanceof Error ? err.message : 'Unknown error'
                )
            }
        }

        return stats
    } catch (error) {
        console.error('Error in processPendingReminders:', error)
        throw error
    }
}

/**
 * Mark a reminder as sent
 */
async function markReminderSent(
    reminderId: string,
    sentVia: string[],
    error: string | null = null
): Promise<void> {
    await prisma.reminder.update({
        where: { id: reminderId },
        data: {
            isSent: true,
            sentAt: new Date(),
            sentVia,
            error,
        },
    })
}

/**
 * Process daily email digests
 * Should be run once per day
 */
export async function processDailyDigests(): Promise<{
    sent: number
    errors: number
}> {
    const stats = { sent: 0, errors: 0 }

    try {
        // Find users with daily digest enabled
        const users = await prisma.profile.findMany({
            where: {
                notificationPreferences: {
                    emailDigest: true,
                    digestFrequency: 'daily',
                },
            },
            include: {
                notificationPreferences: true,
                tasks: {
                    where: {
                        completed: false,
                        dueDate: {
                            gte: new Date(),
                            lte: addHours(new Date(), 48), // Next 48 hours
                        },
                    },
                    orderBy: {
                        dueDate: 'asc',
                    },
                    take: 20,
                },
            },
        })

        for (const user of users) {
            if (user.tasks.length === 0) continue

            try {
                const { sendDigestEmail } = await import('./email')
                await sendDigestEmail(
                    user.email,
                    user.displayName || user.email.split('@')[0],
                    user.tasks.map(t => ({
                        title: t.title,
                        dueDate: t.dueDate || undefined,
                        priority: t.priority || undefined,
                    }))
                )
                stats.sent++
            } catch (err) {
                console.error(`Error sending digest to ${user.email}:`, err)
                stats.errors++
            }
        }

        return stats
    } catch (error) {
        console.error('Error in processDailyDigests:', error)
        throw error
    }
}
