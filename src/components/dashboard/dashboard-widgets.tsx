import prisma from '@/lib/prisma'
import { StatsRow } from '@/components/dashboard/stats-row'
import { FocusWidget } from '@/components/dashboard/focus-widget'
import { ActivityWidget } from '@/components/dashboard/activity-widget'
import { DateWidget } from '@/components/dashboard/date-widget'
import { HabitsWidget } from '@/components/dashboard/habits-widget'
import { getCachedUserStats } from '@/lib/cache/profile-cache'

interface DashboardWidgetsProps {
    userId: string
}

export async function DashboardWidgets({ userId }: DashboardWidgetsProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today.getTime() + 86400000)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000) // Performance optimization

    // Optimized: Fetch only what's needed in parallel
    const [
        activeTasks,
        cachedStats,
        recentActivity,
        habits,
        completedTodayCount
    ] = await Promise.all([
        // Only active tasks for TODAY (not all past tasks)
        prisma.task.findMany({
            where: {
                userId: userId,
                completed: false,
                dueDate: {
                    gte: today,    // Start of today (inclusive)
                    lt: tomorrow   // Before tomorrow (exclusive)
                }
            },
            select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true,
                completed: true,
            },
            take: 50
        }),

        // Cached profile and XP stats (reduces queries)
        getCachedUserStats(userId),

        // Recent activity (limit 10) - Only fetch last 30 days for performance
        prisma.task.findMany({
            where: {
                userId: userId,
                completed: true,
                completedAt: {
                    not: null,
                    gte: thirtyDaysAgo  // Performance: Only recent tasks
                }
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                title: true,
                completedAt: true
            }
        }),

        // Active habits (limit 5)
        prisma.habit.findMany({
            where: { userId: userId, isActive: true },
            take: 5
        }),

        // Completed today count
        prisma.task.count({
            where: {
                userId: userId,
                completed: true,
                completedAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        })
    ])

    const profile = cachedStats.profile

    // Map activity
    const activityItems = recentActivity.map((task: any) => ({
        id: task.id,
        type: 'task' as const,
        title: `Completed: ${task.title}`,
        description: 'Task completion',
        date: task.completedAt!,
        data: task
    }))

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 lg:col-span-9 space-y-6">
                <StatsRow
                    completedTasks={completedTodayCount}
                    totalTasks={activeTasks.length + completedTodayCount}
                    streak={profile?.currentStreak || 0}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                    <FocusWidget tasks={activeTasks} />
                    <ActivityWidget activities={activityItems} />
                </div>
            </div>

            <div className="md:col-span-4 lg:col-span-3 space-y-6">
                <DateWidget />
                <HabitsWidget habits={habits} />
            </div>
        </div>
    )
}
