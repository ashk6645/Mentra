import { getTasks } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsRow } from '@/components/dashboard/stats-row'
import { FocusWidget } from '@/components/dashboard/focus-widget'
import { ActivityWidget } from '@/components/dashboard/activity-widget'
import { DateWidget } from '@/components/dashboard/date-widget'
import { HabitsWidget } from '@/components/dashboard/habits-widget'

export default async function DashboardPage() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return <div className="p-8">Please log in to view dashboard</div>
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Fetch only necessary data in parallel
        const [
            todayTasksResult,
            profile,
            stats,
            recentActivity,
            habits,
            totalCompletedTasks
        ] = await Promise.all([
            // 1. Get ONLY today's tasks + overdue (simplified for now to just all active tasks for filtering)
            // Ideally we'd filter by date in DB, but due date handling can be complex with timezones.
            // For now, let's at least filter out completed tasks
            getTasks({ completed: false }),

            // 2. Profile
            prisma.profile.findUnique({
                where: { id: user.id },
            }),

            // 3. XP Stats
            prisma.xPLog.aggregate({
                where: { userId: user.id },
                _sum: { amount: true }
            }),

            // 4. Recent Activity (Completed tasks limit 10)
            prisma.task.findMany({
                where: {
                    userId: user.id,
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

            // 5. Active Habits
            prisma.habit.findMany({
                where: { userId: user.id, isActive: true },
                take: 5
            }),

            // 6. Total Completed Count
            prisma.task.count({
                where: {
                    userId: user.id,
                    completed: true
                }
            })
        ])

        const tasks = todayTasksResult.success && todayTasksResult.data ? todayTasksResult.data : []
        const totalXP = stats._sum.amount || 0

        // In-memory date filtering for today's view (safe because dataset is now smaller - only active tasks)
        const todayTasks = tasks.filter((task: any) => {
            if (!task.dueDate) return false
            const due = new Date(task.dueDate)
            due.setHours(0, 0, 0, 0)
            return due.getTime() <= today.getTime() // Today or Overdue
        })

        // For "Completed Today" count, we ran a count query? No, we didn't. 
        // Let's run a specific count query for today's completions to be accurate and fast
        const completedTodayCount = await prisma.task.count({
            where: {
                userId: user.id,
                completed: true,
                completedAt: {
                    gte: today,
                    lt: new Date(today.getTime() + 86400000)
                }
            }
        })

        // Map recent activity for widget
        const activityItems = recentActivity.map((task: any) => ({
            id: task.id,
            type: 'task' as const,
            title: `Completed: ${task.title}`,
            description: 'Task completion',
            date: task.completedAt!,
            data: task
        }))

        const displayName = profile?.displayName || user?.user_metadata?.display_name || 'User'

        return (
            <div className="flex-1 p-6 md:p-8 pt-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
                {/* Header Section */}
                <DashboardHeader
                    displayName={displayName}
                    hoursRemaining={4} // Placeholder: Calculate real work hours remaining
                />

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column (Main Content) */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-6">
                        <StatsRow
                            completedTasks={completedTodayCount}
                            totalTasks={todayTasks.length + completedTodayCount} // Simple logic for daily progress
                            streak={profile?.currentStreak || 0}
                            xp={totalXP}
                            totalCompleted={Number(totalCompletedTasks) || 0}
                        />

                        {/* Focus & Activity Split */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                            <FocusWidget tasks={todayTasks} />
                            <ActivityWidget activities={activityItems} />
                        </div>
                    </div>

                    {/* Right Column (Sidebar Widgets) */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        <DateWidget />
                        <HabitsWidget habits={habits} />
                    </div>
                </div>
            </div>
        )
    } catch (error) {
        console.error('Dashboard Error:', error)
        return <div className="p-8 text-center text-muted-foreground">Unable to load dashboard. Please try refreshing.</div>
    }
}
