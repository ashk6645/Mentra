import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/server'
import { getUserStats } from '@/lib/actions/gamification'
import { CheckCircle2, Clock, TrendingUp, Trophy, Flame, Calendar, Activity } from 'lucide-react'
import prisma from '@/lib/prisma'
import { cn } from '@/lib/utils'

export async function ProfileStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get stats
  const { data: stats } = await getUserStats()

  // Get task statistics
  const [totalTasks, completedTasks, todayTasks] = await Promise.all([
    prisma.task.count({ where: { userId: user.id } }),
    prisma.task.count({ where: { userId: user.id, completed: true } }),
    prisma.task.count({
      where: {
        userId: user.id,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
  ])

  // Get focus time (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const focusSessions = await prisma.focusSession.aggregate({
    where: {
      userId: user.id,
      startedAt: { gte: sevenDaysAgo }
    },
    _sum: {
      durationMinutes: true
    }
  })

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const focusMinutes = focusSessions._sum.durationMinutes || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* XP & Level */}
      <Card className="border shadow-none bg-card hover:border-primary/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Experience</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats?.xp || 0} XP</div>
          <p className="text-xs text-muted-foreground mb-3">
            Level {stats?.level || 1}
          </p>
          <Progress
            value={stats?.xpProgress?.percentage || 0}
            className="h-1.5"
          />
          <p className="mt-2 text-xs text-muted-foreground/80">
            {stats?.xpProgress?.needed ? stats.xpProgress.needed - stats.xpProgress.current : 100} XP to next level
          </p>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card className="border shadow-none bg-card hover:border-orange-500/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats?.streakCount || 0} Days</div>
          <p className="text-xs text-muted-foreground mb-3">
            Keep the fire burning!
          </p>
          <div className="flex gap-1 h-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full",
                  i < (stats?.streakCount || 0) % 7 ? 'bg-orange-500' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="border shadow-none bg-card hover:border-green-500/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{completedTasks}</div>
          <p className="text-xs text-muted-foreground mb-3">
            Completed All Time
          </p>
          <Progress value={completionRate} className="h-1.5 bg-muted" indicatorClassName="bg-green-500" />
          <p className="mt-2 text-xs text-muted-foreground/80">
            {completionRate}% Completion Rate
          </p>
        </CardContent>
      </Card>

      {/* Focus Time */}
      <Card className="border shadow-none bg-card hover:border-purple-500/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Focus</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Last 7 Days
          </p>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">
              Avg {Math.round(focusMinutes / 7)}m / day
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
