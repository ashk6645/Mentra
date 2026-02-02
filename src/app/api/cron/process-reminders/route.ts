/**
 * Cron endpoint for processing reminders
 * This endpoint should be called every minute by Vercel Cron
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-reminders",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPendingReminders } from '@/lib/notifications/processor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[CRON] Processing reminders...')
        const stats = await processPendingReminders()

        console.log('[CRON] Reminder processing complete:', stats)

        // Process overdue tasks (once per hour, at minute 0)
        const currentMinute = new Date().getMinutes()
        let overdueStats = { processed: 0, sent: 0, errors: 0 }

        if (currentMinute === 0) {
            console.log('[CRON] Processing overdue tasks...')
            const { processOverdueTasks } = await import('@/lib/notifications/overdue')
            overdueStats = await processOverdueTasks()
            console.log('[CRON] Overdue processing complete:', overdueStats)
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            stats: {
                reminders: stats,
                overdue: overdueStats,
            },
        })
    } catch (error) {
        console.error('[CRON] Error processing reminders:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        )
    }
}
