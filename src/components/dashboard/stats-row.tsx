'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Flame, Trophy, Zap } from 'lucide-react'

interface StatsRowProps {
    completedTasks: number
    totalTasks: number
    streak: number
    xp: number
}

export function StatsRow({ completedTasks, totalTasks, streak, xp }: StatsRowProps) {
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
        },
        {
            label: 'Total XP',
            value: xp.toLocaleString(),
            icon: Zap,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item, index) => (
                <Card key={index} className="border-none shadow-sm bg-card hover:bg-accent/5 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                            <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                        </div>
                        <div className={`p-3 rounded-full ${item.bgColor}`}>
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
