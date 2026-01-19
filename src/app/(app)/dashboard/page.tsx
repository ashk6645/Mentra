import { getTasks } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskCard } from '@/components/tasks/task-card'
import { Button } from '@/components/ui/button'
import { Sparkles, Flame, Target, Timer, TrendingUp, Plus, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ProfileStats } from '@/components/profile/profile-stats'

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

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
        const [tasksResult, profile] = await Promise.all([
            getTasks(),
            prisma.profile.findUnique({
                where: { id: user.id },
                select: { displayName: true }
            })
        ])

        if (!tasksResult.success) {
            return <div className="p-8">Error loading dashboard.</div>
        }

        const tasks = tasksResult.data || []

        // Filter tasks
        const todayTasks: any[] = []
        const overdueTasks: any[] = []

        tasks.forEach(task => {
            if (task.dueDate && !task.completed) {
                const due = new Date(task.dueDate)
                due.setHours(0, 0, 0, 0)
                if (due.getTime() === today.getTime()) {
                    todayTasks.push(task)
                } else if (due < today) {
                    overdueTasks.push(task)
                }
            }
        })

        const displayName = profile?.displayName || user?.user_metadata?.display_name || 'User'
        const greeting = getGreeting()

        return (
            <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto animate-in-fade">
                {/* Greeting Section */}
                <div className="flex justify-between items-end pb-2 border-b border-border/40">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            {greeting}, {displayName}
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Here's what's happening today.
                        </p>
                    </div>
                </div>

                {/* Profile Overview */}
                <ProfileStats />

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Combined Overview */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Urgent / AI Insight */}
                        {(overdueTasks.length > 0 || todayTasks.length > 0) && (
                            <Card className="border-l-4 border-l-primary shadow-sm bg-accent/20">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">Focus for Today</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-4">
                                        {overdueTasks.length > 0 && (
                                            <div className="flex items-center justify-between text-sm p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md">
                                                <span>You have {overdueTasks.length} overdue tasks.</span>
                                                <Link href="/tasks" className="font-medium underline underline-offset-4 hover:opacity-80">Review</Link>
                                            </div>
                                        )}
                                        {todayTasks.length > 0 ? (
                                            <div className="space-y-1">
                                                <p className="text-sm text-foreground/80">
                                                    You have <strong>{todayTasks.length} tasks</strong> scheduled for today.
                                                </p>
                                                <div className="h-1 bg-muted rounded-full w-full overflow-hidden mt-2">
                                                    <div className="h-full bg-primary w-1/4 rounded-full" />
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No tasks scheduled for today yet.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tasks Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold tracking-tight">Today's Tasks</h2>
                                <Button variant="ghost" size="sm" asChild className="gap-1">
                                    <Link href="/tasks">
                                        View All <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>

                            {todayTasks.length > 0 ? (
                                <div className="grid gap-3">
                                    {todayTasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-dashed shadow-none bg-muted/30">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-background p-3 rounded-full mb-3 shadow-sm">
                                            <CheckCircle2 className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="font-medium text-foreground">All caught up!</h3>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
                                            You have no tasks scheduled for today. Enjoy your free time or plan ahead.
                                        </p>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href="/tasks">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Task
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Quick Actions & Habits */}
                    <div className="space-y-6">
                        <Card className="shadow-sm border-none bg-gradient-to-b from-card to-muted/20">
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <Button variant="outline" className="justify-start bg-background/50" asChild>
                                    <Link href="/tasks">
                                        <Plus className="mr-2 h-4 w-4" /> Add New Task
                                    </Link>
                                </Button>
                                <Button variant="outline" className="justify-start bg-background/50" asChild>
                                    <Link href="/focus">
                                        <Timer className="mr-2 h-4 w-4" /> Start Focus Session
                                    </Link>
                                </Button>
                                <Button variant="outline" className="justify-start bg-background/50" asChild>
                                    <Link href="/habits">
                                        <Flame className="mr-2 h-4 w-4" /> Check Habits
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Recent Activity / Mini List - Placeholder for now, maybe Habits later */}
                        <div className="rounded-xl bg-card border shadow-sm p-4">
                            <h3 className="font-semibold mb-3 text-sm">Habits</h3>
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Go to Habits page to track your daily routines.</p>
                                <Button variant="secondary" size="sm" className="w-full text-xs h-8" asChild>
                                    <Link href="/habits">View Habits</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } catch (error) {
        console.error('Dashboard Error:', error)
        return <div className="p-8">Failed to load dashboard.</div>
    }
}
