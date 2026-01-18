import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getUserStats } from '@/lib/actions/gamification'
import { Target, CheckCircle2, Clock, TrendingUp, Zap, Trophy, Flame, Calendar } from 'lucide-react'
import prisma from '@/lib/prisma'

export async function ProfileStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get stats
  const stats = await getUserStats()
  
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Experience</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.xp || 0} XP</div>
          <p className="text-xs text-muted-foreground">
            Level {stats?.level || 1}
          </p>
          <Progress 
            value={stats?.xpProgress.percentage || 0} 
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.xpProgress.current || 0} / {stats?.xpProgress.needed || 100} to next level
          </p>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.streakCount || 0} days</div>
          <p className="text-xs text-muted-foreground">
            Keep it going! 🔥
          </p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i < (stats?.streakCount || 0) % 7 ? 'bg-orange-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            {totalTasks} total tasks
          </p>
          <Progress value={completionRate} className="mt-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      {/* Focus Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m
          </div>
          <p className="text-xs text-muted-foreground">
            Last 7 days
          </p>
          <Badge variant="secondary" className="mt-2">
            {Math.round(focusMinutes / 7)}m daily avg
          </Badge>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Productivity Overview</CardTitle>
          <CardDescription>Your performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks Due Today</span>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{todayTasks}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{completionRate}%</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average XP/Day</span>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats ? Math.round(stats.xp / Math.max(stats.streakCount, 1)) : 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
