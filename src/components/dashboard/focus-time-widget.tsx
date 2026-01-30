'use client'

import { Timer, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface FocusSession {
    id: string
    durationMinutes: number // in minutes
    startedAt: Date
    completed: boolean
}

interface FocusTimeWidgetProps {
    sessions: FocusSession[]
}

export function FocusTimeWidget({ sessions }: FocusTimeWidgetProps) {
    const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.completed ? curr.durationMinutes : 0), 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return (
        <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Deep Work</h3>
            </div>

            <div className="text-center py-4 bg-muted/20 rounded-xl">
                <p className="text-3xl font-bold tracking-tight">
                    {hours}<span className="text-lg font-normal text-muted-foreground">h</span> {minutes}<span className="text-lg font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total focus time this week</p>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Recent Sessions</p>
                {sessions.slice(0, 3).map(session => (
                    <div key={session.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{session.durationMinutes} min session</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                        </span>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No recent sessions</p>
                )}
            </div>
        </Card>
    )
}
