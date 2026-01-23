'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Zap, CheckCircle2, Clock } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
    id: string
    type: 'xp' | 'task' | 'focus'
    title: string
    description: string
    date: Date
    data?: any
}

interface ActivityWidgetProps {
    activities: ActivityItem[]
}

export function ActivityWidget({ activities }: ActivityWidgetProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'xp': return <Zap className="h-4 w-4 text-yellow-500" />
            case 'task': return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'focus': return <Clock className="h-4 w-4 text-blue-500" />
            default: return <Activity className="h-4 w-4" />
        }
    }

    return (
        <Card className="h-full border-none shadow-sm bg-card flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[250px] px-6">
                    <div className="space-y-6 pb-6 pt-2">
                        {activities.length > 0 ? (
                            activities.map((item, index) => (
                                <div key={`${item.type}-${index}`} className="flex gap-4 relative">
                                    {/* Timeline line */}
                                    {index !== activities.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-border/40" />
                                    )}

                                    <div className="relative z-10 bg-card">
                                        <div className="p-1 rounded-full bg-muted/50 border border-border/50">
                                            {getIcon(item.type)}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-1 pt-0.5">
                                        <p className="text-sm font-medium leading-none">{item.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                        <p className="text-[10px] text-muted-foreground/60">
                                            {formatDistanceToNow(item.date, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No recent activity
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
