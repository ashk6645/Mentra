import prisma from '@/lib/prisma'
import { QuickTaskEntry } from '@/components/dashboard/quick-task-entry'
import { AIInsightsWidget } from '@/components/dashboard/ai-insights-widget'
import { LifeAreasWidget } from '@/components/dashboard/life-areas-widget'
import { TodayTasksWidget } from '@/components/dashboard/today-tasks-widget'
import { UpcomingWidget } from '@/components/dashboard/upcoming-widget'
import { HabitsStreakWidget } from '@/components/dashboard/habits-streak-widget'
import { FocusTimeWidget } from '@/components/dashboard/focus-time-widget'
import { AchievementsWidget } from '@/components/dashboard/achievements-widget'
import { ProductivityChart } from '@/components/dashboard/productivity-chart'

interface DashboardContentProps {
    userId: string
    profile: any
}

export async function DashboardContent({ userId, profile }: DashboardContentProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today.getTime() + 86400000)
    const nextWeek = new Date(today.getTime() + 7 * 86400000)

    // Fetch all dashboard data in parallel
    const [
        todayTasks,
        upcomingTasks,
        completedToday,
        habits,
        areas,
        recentSessions,
        weeklyStats,
        completedAllTime
    ] = await Promise.all([
        // Today's tasks
        prisma.task.findMany({
            where: {
                userId,
                completed: false,
                dueDate: {
                    gte: today,
                    lt: tomorrow
                }
            },
            select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ],
            take: 10
        }),

        // Upcoming tasks (next 7 days)
        prisma.task.findMany({
            where: {
                userId,
                completed: false,
                dueDate: {
                    gte: tomorrow,
                    lt: nextWeek
                }
            },
            select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true,
            },
            orderBy: { dueDate: 'asc' },
            take: 5
        }),

        // Completed today
        prisma.task.count({
            where: {
                userId,
                completed: true,
                completedAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        }),

        // Active habits
        prisma.habit.findMany({
            where: { userId, isActive: true },
            select: {
                id: true,
                name: true,
                icon: true,
                frequency: true,
                currentStreak: true,
                completions: {
                    where: {
                        completedAt: {
                            gte: new Date(today.getTime() - 7 * 86400000)
                        }
                    },
                    orderBy: { completedAt: 'desc' },
                    take: 7
                }
            },
            take: 6
        }),

        // Life areas placeholder (model not yet implemented)
        Promise.resolve([]),

        // Recent focus sessions (last 7 days)
        prisma.focusSession.findMany({
            where: {
                userId,
                startedAt: {
                    gte: new Date(today.getTime() - 7 * 86400000)
                }
            },
            select: {
                id: true,
                durationMinutes: true,
                startedAt: true,
                completed: true
            },
            orderBy: { startedAt: 'desc' },
            take: 20
        }),

        // Weekly completion stats
        prisma.$queryRaw`
            SELECT 
                DATE(completed_at) as date,
                COUNT(*) as count
            FROM "tasks"
            WHERE user_id = ${userId}
                AND completed = true
                AND completed_at >= ${new Date(today.getTime() - 7 * 86400000)}
            GROUP BY DATE(completed_at)
            ORDER BY date ASC
        `,

        // Total completed tasks (All time)
        prisma.task.count({
            where: {
                userId,
                completed: true
            }
        })
    ])

    return (
        <div className="space-y-6">
            {/* Quick Task Entry */}
            <QuickTaskEntry userId={userId} />

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Column - Primary Focus */}
                <div className="xl:col-span-8 space-y-6">
                    {/* AI Insights Banner */}
                    <AIInsightsWidget
                        userId={userId}
                        completedToday={completedToday}
                        todayTasksCount={todayTasks.length}
                    />

                    {/* Today's Tasks */}
                    <TodayTasksWidget
                        tasks={todayTasks}
                        completedCount={completedToday}
                    />

                    {/* Life Areas Balance */}
                    <LifeAreasWidget areas={areas} />

                    {/* Productivity Chart */}
                    <ProductivityChart weeklyStats={weeklyStats} />
                </div>

                {/* Right Column - Secondary Info */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Upcoming Tasks */}
                    <UpcomingWidget tasks={upcomingTasks} />

                    {/* Habits Streak */}
                    <HabitsStreakWidget habits={habits} />

                    {/* Focus Time */}
                    <FocusTimeWidget sessions={recentSessions} />

                    {/* Achievements Preview */}
                    <AchievementsWidget
                        level={profile?.level || 1}
                        streak={profile?.currentStreak || 0}
                        totalCompleted={completedAllTime}
                    />
                </div>
            </div>
        </div>
    )
}
