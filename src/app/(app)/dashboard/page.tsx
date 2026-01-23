import { getTasks } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsRow } from '@/components/dashboard/stats-row'
import { FocusWidget } from '@/components/dashboard/focus-widget'
import { ActivityWidget } from '@/components/dashboard/activity-widget'
import { DateWidget } from '@/components/dashboard/date-widget'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ProjectsGrid } from '@/components/dashboard/projects-grid'
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

        // Fetch all data in parallel
        const [tasksResult, profile, stats, projects, recentActivity, habits] = await Promise.all([
            getTasks(),
            prisma.profile.findUnique({
                where: { id: user.id },
            }),
            // Get user stats (simplified query for now, can be extracted to action)
            prisma.xPLog.aggregate({
                where: { userId: user.id },
                _sum: { amount: true }
            }),
            // Get active projects with task counts
            prisma.project.findMany({
                where: { userId: user.id, isArchived: false },
                include: {
                    _count: {
                        select: { tasks: { where: { completed: false } } }
                    }
                },
                take: 5,
                orderBy: { updatedAt: 'desc' }
            }),
            // Get recent activity (completed tasks for now)
            prisma.task.findMany({
                where: {
                    userId: user.id,
                    completed: true,
                    completedAt: { not: null }
                },
                orderBy: { completedAt: 'desc' },
                take: 10
            }),
            // Get habits
            prisma.habit.findMany({
                where: { userId: user.id, isActive: true },
                take: 5
            })
        ])

        const tasks = tasksResult.success && tasksResult.data ? tasksResult.data : []
        const totalXP = stats._sum.amount || 0

        // Process tasks for widgets
        const todayTasks = tasks.filter((task: any) => {
            if (task.completed) return false
            if (!task.dueDate) return false
            const due = new Date(task.dueDate)
            due.setHours(0, 0, 0, 0)
            return due.getTime() === today.getTime() || due < today
        })

        const completedToday = tasks.filter((task: any) => {
            if (!task.completed || !task.completedAt) return false
            const completed = new Date(task.completedAt)
            completed.setHours(0, 0, 0, 0)
            return completed.getTime() === today.getTime()
        }).length

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
                        {/* Stats Row */}
                        <StatsRow
                            completedTasks={completedToday}
                            totalTasks={todayTasks.length + completedToday} // Simple logic for daily progress
                            streak={profile?.currentStreak || 0}
                            xp={totalXP}
                        />

                        {/* Focus & Activity Split */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[350px]">
                            <FocusWidget tasks={todayTasks} />
                            <ActivityWidget activities={activityItems} />
                        </div>

                        {/* Projects Grid */}
                        <ProjectsGrid projects={projects} />
                    </div>

                    {/* Right Column (Sidebar Widgets) */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        <DateWidget />
                        <QuickActions />
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
