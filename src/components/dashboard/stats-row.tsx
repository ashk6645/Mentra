'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Flame } from 'lucide-react'

interface StatsRowProps {
    completedTasks: number
    totalTasks: number
    streak: number
}

export function StatsRow({ completedTasks, totalTasks, streak }: StatsRowProps) {
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const items = [
        {
            label: 'Daily Progress',
            value: `${completionRate}%`,
            icon: CheckCircle2,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            label: 'Current Streak',
            value: `${streak} Days`,
            icon: Flame,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, index) => (
                <Card key={index} className="border-none shadow-sm bg-card hover:bg-accent/5 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                            <p className="text-xl font-bold tracking-tight">{item.value}</p>
                        </div>
                        <div className={`p-2 rounded-full ${item.bgColor}`}>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
