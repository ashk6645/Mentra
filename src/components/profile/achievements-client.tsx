'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Crown, Trophy, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Achievement {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    progress: number
    max: number
    unlocked: boolean
    category: 'tasks' | 'streak' | 'xp' | 'focus'
}

interface AchievementsClientProps {
    achievements: Achievement[]
    unlockedCount: number
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export function AchievementsClient({ achievements, unlockedCount }: AchievementsClientProps) {
    const categories = ['tasks', 'streak', 'xp', 'focus'] as const
    const progressPercentage = Math.round((unlockedCount / achievements.length) * 100)

    return (
        <div className="space-y-8 pb-8">
            {/* Premium Header Stats */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 p-8"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Trophy className="w-64 h-64 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Achievement Progress
                            </h2>
                            <p className="text-muted-foreground mt-2 text-lg">
                                You've unlocked <span className="text-primary font-semibold">{unlockedCount}</span> out of <span className="text-foreground font-semibold">{achievements.length}</span> badges
                            </p>
                        </div>

                        <div className="space-y-2 max-w-md">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Total Completion</span>
                                <span>{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-3 bg-secondary/50" />
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-background/50 backdrop-blur-xl border-4 border-primary/20 shadow-2xl shadow-primary/20">
                            <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-[spin_3s_linear_infinite]" />
                            <Crown className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Categories Grid */}
            <div className="space-y-12">
                {categories.map((category, catIndex) => {
                    const categoryAchievements = achievements.filter(a => a.category === category)
                    const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length

                    return (
                        <motion.div
                            key={category}
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-100px" }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                                <h3 className="text-2xl font-bold capitalize tracking-tight">{category}</h3>
                                <Badge variant="outline" className="text-base py-1 px-3 bg-background/50 backdrop-blur-sm">
                                    {categoryUnlocked}/{categoryAchievements.length}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryAchievements.map((achievement) => (
                                    <motion.div
                                        key={achievement.id}
                                        variants={item}
                                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                        className={cn(
                                            "group relative overflow-hidden rounded-2xl border bg-card/50 p-6 backdrop-blur-sm transition-colors",
                                            achievement.unlocked
                                                ? "border-primary/20 bg-gradient-to-b from-primary/5 to-transparent hover:border-primary/40"
                                                : "border-border/40 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        {/* Background glow effect for unlocked */}
                                        {achievement.unlocked && (
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        )}

                                        <div className="relative z-10 flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className={cn(
                                                    "rounded-xl p-3 shadow-sm transition-all duration-300",
                                                    achievement.unlocked
                                                        ? "bg-primary text-primary-foreground shadow-primary/20 group-hover:scale-110 group-hover:rotate-3"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                                                </div>
                                                {achievement.unlocked && (
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                        Unlocked
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
                                                    {achievement.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {achievement.description}
                                                </p>
                                            </div>

                                            <div className="space-y-2 mt-2 pt-4 border-t border-border/20">
                                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                                    <span>Progress</span>
                                                    <span>{achievement.progress} / {achievement.max}</span>
                                                </div>
                                                <Progress
                                                    value={(achievement.progress / achievement.max) * 100}
                                                    className={cn(
                                                        "h-2",
                                                        achievement.unlocked ? "bg-primary/20" : "bg-muted"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
