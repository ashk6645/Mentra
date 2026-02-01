'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getUserStats, getAchievementStats } from '@/lib/actions/gamification'
import { CheckCircle2, Clock, Activity, Trophy, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

export function ProfileStats() {
  const [stats, setStats] = useState<any>(null)
  const [achievementStats, setAchievementStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResult, achievementResult] = await Promise.all([
          getUserStats(),
          getAchievementStats()
        ])

        if (statsResult.success) {
          setStats(statsResult.data)
        }

        if (achievementResult.success) {
          setAchievementStats(achievementResult.data)
        }
      } catch (error) {
        console.error('Error fetching profile stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border shadow-none bg-card/50">
            <CardContent className="h-32 flex items-center justify-center animate-pulse">
              <div className="h-2 w-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const completionRate = achievementStats?.totalTasks > 0
    ? Math.round((achievementStats?.completedTasks / achievementStats?.totalTasks) * 100)
    : 0

  const focusMinutes = achievementStats?.recentFocusMinutes || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Tasks */}
      <Card className="border shadow-none bg-card hover:border-green-500/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{achievementStats?.completedTasks || 0}</div>
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
