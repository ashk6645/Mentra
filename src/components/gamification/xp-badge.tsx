'use client'

import { useEffect, useState } from 'react'
import { getUserStats } from '@/lib/actions/gamification'
import { Flame, Zap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface UserStats {
    xp: number
    level: number
    streakCount: number
    xpProgress: {
        current: number
        needed: number
        percentage: number
    }
}

export function XPBadge() {
    const [stats, setStats] = useState<UserStats | null>(null)

    useEffect(() => {
        getUserStats().then(setStats)
    }, [])

    if (!stats) return null

    return (
        <div className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200/50">
            {/* Level Badge */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-yellow-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                        {stats.level}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Level</span>
                    <span className="text-sm font-semibold">{stats.level}</span>
                </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1 min-w-[100px]">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3 text-purple-500" />
                        {stats.xpProgress.current} / {stats.xpProgress.needed} XP
                    </span>
                </div>
                <Progress value={stats.xpProgress.percentage} className="h-2" />
            </div>

            {/* Streak */}
            <div className="flex items-center gap-2">
                <Flame className={cn(
                    "h-5 w-5",
                    stats.streakCount > 0 ? "text-orange-500" : "text-gray-400"
                )} />
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Streak</span>
                    <span className="text-sm font-semibold">{stats.streakCount} days</span>
                </div>
            </div>
        </div>
    )
}

export function StreakCounter({ count }: { count: number }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <Flame className={cn(
                "h-4 w-4",
                count > 0 ? "text-orange-500 animate-pulse" : "text-gray-400"
            )} />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                {count} day{count !== 1 ? 's' : ''}
            </span>
        </div>
    )
}

export function LevelBadge({ level }: { level: number }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                Lvl {level}
            </span>
        </div>
    )
}
