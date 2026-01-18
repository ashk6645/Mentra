import { getTasks } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskCard } from '@/components/tasks/task-card'
import { Button } from '@/components/ui/button'
import { Sparkles, Flame, Target, Timer, TrendingUp, Plus, Lightbulb } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const tasks = await getTasks()
    
    // Fetch profile for personalization
    const profile = await prisma.profile.findUnique({
        where: { id: user?.id },
        select: {
            displayName: true,
            totalXp: true,
            level: true,
            currentStreak: true,
            updatedAt: true,
        }
    })

    // Calculate meaningful metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completedThisWeek = tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false
        const completed = new Date(t.completedAt)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return completed >= weekAgo
    }).length

    const todayTasks = tasks.filter(t => {
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        due.setHours(0, 0, 0, 0)
        return due.getTime() === today.getTime() && !t.completed
    })

    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false
        const due = new Date(t.dueDate)
        return due < today
    })

    // Get focus time (placeholder - would come from focus_sessions)
    const focusSessions = await prisma.focusSession.findMany({
        where: {
            userId: user?.id,
            startedAt: {
                gte: today
            }
        },
        select: { durationMinutes: true }
    })
    
    const focusTimeToday = focusSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)

    const displayName = profile?.displayName || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there'
    const greeting = getGreeting()

    // AI Insights logic
    const aiInsights = []
    if (overdueTasks.length > 0) {
        aiInsights.push({
            icon: '🎯',
            text: `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}. Would you like help rescheduling?`,
            action: 'Reschedule',
            href: '/tasks'
        })
    } else if (todayTasks.length === 0 && tasks.length > 0) {
        aiInsights.push({
            icon: '✨',
            text: 'Light day detected. Great time to focus on habits or tackle that project you\'ve been postponing.',
            action: 'View Habits',
            href: '/habits'
        })
    } else if (completedThisWeek >= 10) {
        aiInsights.push({
            icon: '🎉',
            text: `Strong week! You've completed ${completedThisWeek} tasks. You're building excellent momentum.`,
            action: null,
            href: null
        })
    } else {
        aiInsights.push({
            icon: '💡',
            text: `Based on your patterns, you're most productive between 8-10 PM. Consider scheduling important tasks then.`,
            action: null,
            href: null
        })
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Premium Greeting Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight">
                    {greeting}, {displayName} 👋
                </h1>
                <p className="text-muted-foreground text-lg">
                    Here's your focus and progress for today.
                </p>
            </div>

            {/* Meaningful Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Focus Streak */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Focus Streak
                        </CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">{profile?.currentStreak || 0} days</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {profile?.currentStreak === 0 ? 'Start your streak today' : 'Keep it going!'}
                        </p>
                    </CardContent>
                </Card>

                {/* Tasks Completed This Week */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completed This Week
                        </CardTitle>
                        <Target className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">{completedThisWeek}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {completedThisWeek === 0 ? 'First task this week?' : 'Great progress'}
                        </p>
                    </CardContent>
                </Card>

                {/* XP Progress */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            XP Progress
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">Level {profile?.level || 1}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {profile?.totalXp || 0} XP earned
                        </p>
                    </CardContent>
                </Card>

                {/* Time Focused Today */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Focused Today
                        </CardTitle>
                        <Timer className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">{focusTimeToday}m</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {focusTimeToday === 0 ? 'Start a focus session' : 'Deep work time'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* AI Insight Panel */}
                <Card className="lg:col-span-4 border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-medium">AI Insight</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <span className="text-2xl">{insight.icon}</span>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm leading-relaxed">{insight.text}</p>
                                    {insight.action && insight.href && (
                                        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                                            <Link href={insight.href}>
                                                {insight.action}
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="lg:col-span-3 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                        <CardDescription>Jump to your most used features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/focus">
                                <Timer className="mr-2 h-4 w-4" />
                                Start Focus Session
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/today">
                                <Target className="mr-2 h-4 w-4" />
                                View Today's Tasks
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/habits">
                                <Flame className="mr-2 h-4 w-4" />
                                Check In Habits
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Tasks */}
                <Card className="lg:col-span-7 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-medium">Your Tasks</CardTitle>
                            <CardDescription className="mt-1">
                                {tasks.length === 0 ? 'Your task list is empty' : `${todayTasks.length} due today`}
                            </CardDescription>
                        </div>
                        <Button size="sm" asChild>
                            <Link href="/tasks">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Task
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <div className="rounded-full bg-muted p-6">
                                    <Lightbulb className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="font-medium text-lg">Ready to get organized?</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Start by adding your first task. Try typing something like:<br />
                                        <span className="italic text-primary">"Finish DSA assignment tomorrow at 7pm"</span>
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/tasks">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Your First Task
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3">
                                    {tasks.slice(0, 8).map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                    {tasks.length > 8 && (
                                        <Button variant="ghost" className="w-full" asChild>
                                            <Link href="/tasks">
                                                View all {tasks.length} tasks
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
