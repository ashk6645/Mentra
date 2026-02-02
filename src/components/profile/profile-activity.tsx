'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, Clock, Target, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect } from 'react'

export function ProfileActivity() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Note: This would need proper server actions to fetch recent tasks and sessions
        // Simplified for now - in a real implementation, create server actions for this
        setActivities([])
      } catch (error) {
        console.error('Error fetching activity log:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'focus':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'task':
        return {
          title: `Completed: ${activity.data.title}`,
          description: 'Task completion'
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
                  className="flex items-start gap-4 rounded-xl border border-border/25 bg-card/50 backdrop-blur-sm p-4 transition-all hover:bg-accent/50 hover:border-border group"
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
