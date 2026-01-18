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
      isCompleted: true,
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
          title: activity.data.action.replace(/_/g, ' '),
          description: `Earned ${activity.data.points} XP`
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your recent accomplishments and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No activity yet. Start completing tasks to see your progress!
              </div>
            ) : (
              activities.map((activity, index) => {
                const { title, description } = getActivityText(activity)
                return (
                  <div
                    key={`${activity.type}-${index}`}
                    className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-1 rounded-full bg-muted p-2">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{title}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.date, { addSuffix: true })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
