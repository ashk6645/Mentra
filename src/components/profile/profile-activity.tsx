import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, Zap, Target, Trophy, Clock } from 'lucide-react'
import prisma from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export async function ProfileActivity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get recent XP logs
  const xpLogs = await prisma.xPLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  // Get recent completed tasks
  const recentTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      completed: true,
      completedAt: { not: null }
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
    include: {
      project: true
    }
  })

  // Get recent focus sessions
  const recentSessions = await prisma.focusSession.findMany({
    where: {
      userId: user.id,
      endedAt: { not: null }
    },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: {
      task: true
    }
  })

  // Combine and sort all activities
  const activities = [
    ...xpLogs.map(log => ({
      type: 'xp' as const,
      date: log.createdAt,
      data: log
    })),
    ...recentTasks.map(task => ({
      type: 'task' as const,
      date: task.completedAt!,
      data: task
    })),
    ...recentSessions.map(session => ({
      type: 'focus' as const,
      date: session.startedAt,
      data: session
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'focus':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getActivityText = (activity: typeof activities[0]) => {
    switch (activity.type) {
      case 'xp':
        return {
          title: activity.data?.source?.replace(/_/g, ' ') ?? 'Activity',
          description: `Earned ${activity.data.amount} XP`
        }
      case 'task':
        return {
          title: `Completed: ${activity.data.title}`,
          description: activity.data.project?.name || 'Inbox'
        }
      case 'focus':
        return {
          title: `Focus session: ${activity.data.durationMinutes} min`,
          description: activity.data.task?.title || 'Unlinked session'
        }
      default:
        return { title: 'Activity', description: '' }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Your recent accomplishments and actions</p>
      </div>
      
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {activities.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No activity yet. Start completing tasks to see your progress!
                </p>
              </CardContent>
            </Card>
          ) : (
            activities.map((activity, index) => {
              const { title, description } = getActivityText(activity)
              return (
                <div
                  key={`${activity.type}-${index}`}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all hover:bg-accent/50 hover:border-border group"
                >
                  <div className="mt-0.5 rounded-lg bg-muted/80 p-2.5 group-hover:bg-background transition-colors">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{title}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(activity.date, { addSuffix: true })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
