'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Star, Target, Zap, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AchievementsWidgetProps {
    level: number
    streak: number
    totalCompleted: number
}

export function AchievementsWidget({ level, streak, totalCompleted }: AchievementsWidgetProps) {
    const achievements = [
        {
            icon: Target,
            title: "Task Master",
            description: "Complete 100 tasks",
            progress: Math.min((totalCompleted / 100) * 100, 100),
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            icon: Zap,
            title: "Streak Keeper",
            description: "Reach 7 day streak",
            progress: Math.min((streak / 7) * 100, 100),
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            icon: Star,
            title: "Early Bird",
            description: "Complete 10 morning tasks",
            progress: 45, // Dynamic data needed
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        }
    ]

    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Achievements</h3>
                </div>
                <span className="text-sm text-muted-foreground">Level {level}</span>
            </div>

            <div className="space-y-4">
                {achievements.map((achievement, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", achievement.bg)}>
                                <achievement.icon className={cn("h-4 w-4", achievement.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium truncate">{achievement.title}</span>
                                    <span className="text-muted-foreground">{Math.round(achievement.progress)}%</span>
                                </div>
                                <Progress value={achievement.progress} className="h-1.5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    )
}
