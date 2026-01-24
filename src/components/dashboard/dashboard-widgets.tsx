import prisma from '@/lib/prisma'
import { StatsRow } from '@/components/dashboard/stats-row'
import { FocusWidget } from '@/components/dashboard/focus-widget'
import { ActivityWidget } from '@/components/dashboard/activity-widget'
import { DateWidget } from '@/components/dashboard/date-widget'
import { HabitsWidget } from '@/components/dashboard/habits-widget'

interface DashboardWidgetsProps {
    userId: string
}

export async function DashboardWidgets({ userId }: DashboardWidgetsProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today.getTime() + 86400000)

    // Optimized: Fetch only what's needed in parallel
    const [
        activeTasks,
        profile,
        totalXP,
        recentActivity,
        habits,
        completedTodayCount
    ] = await Promise.all([
        // Only active tasks
        prisma.task.findMany({
            where: {
                userId: userId,
                completed: false,
                dueDate: { lte: today }
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

        // Profile
        prisma.profile.findUnique({
            where: { id: userId },
            select: {
                displayName: true,
                currentStreak: true,
            }
        }),

        // XP total
        prisma.xPLog.aggregate({
            where: { userId: userId },
            _sum: { amount: true }
        }),

        // Recent activity (limit 10)
        prisma.task.findMany({
            where: {
                userId: userId,
                completed: true,
                completedAt: { not: null }
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                title: true,
                completedAt: true,
                xpEarned: true
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

    const totalXPValue = totalXP._sum.amount || 0

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
                    xp={totalXPValue}
                    totalCompleted={completedTodayCount}
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
