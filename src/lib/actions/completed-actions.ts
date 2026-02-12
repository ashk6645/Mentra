'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'

interface CompletedTask {
    id: string
    title: string
    completedAt: Date
    priority: string | null

}

interface GroupedCompletedTasks {
    today: CompletedTask[]
    yesterday: CompletedTask[]
    older: Record<string, CompletedTask[]>
}

/**
 * Get local date key in YYYY-MM-DD format
 */
function getLocalDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Fetch all completed tasks grouped by completion date
 * Groups: Today, Yesterday, Older (by date)
 */
export async function getCompletedTasks(): Promise<{ success: boolean; data?: GroupedCompletedTasks; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Fetch all completed tasks ordered by completion date (most recent first)
        const completedTasks = await prisma.task.findMany({
            where: {
                userId: user.id,
                completed: true,
                completedAt: { not: null }
            },
            select: {
                id: true,
                title: true,
                description: true,
                completedAt: true,
                completed: true,
                priority: true,
                dueDate: true,
                sortOrder: true,
                // Recurrence fields
                isRecurring: true,
                recurrenceInterval: true,
                recurrenceStep: true,
                recurrenceDays: true,
                recurrenceEnd: true,
                // Relations
                subtasks: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                        sortOrder: true,
                    },
                    orderBy: {
                        sortOrder: 'asc'
                    }
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            }
                        }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            },
            take: 500  // Limit for performance
        })

        // Group tasks by completion date
        const today = startOfDay(new Date())
        const todayKey = getLocalDateKey(today)

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayKey = getLocalDateKey(yesterday)

        const grouped: GroupedCompletedTasks = {
            today: [],
            yesterday: [],
            older: {}
        }

        for (const task of completedTasks) {
            if (!task.completedAt) continue

            const completedDate = new Date(task.completedAt)
            const dateKey = getLocalDateKey(completedDate)

            if (dateKey === todayKey) {
                grouped.today.push(task as CompletedTask)
            } else if (dateKey === yesterdayKey) {
                grouped.yesterday.push(task as CompletedTask)
            } else {
                if (!grouped.older[dateKey]) {
                    grouped.older[dateKey] = []
                }
                grouped.older[dateKey].push(task as CompletedTask)
            }
        }

        return { success: true, data: grouped }
    } catch (error) {
        console.error('getCompletedTasks error:', error)
        return { success: false, error: 'Failed to fetch completed tasks' }
    }
}
