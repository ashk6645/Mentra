'use client'

import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Lock, Check } from 'lucide-react'
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

export function AchievementsClient({ achievements, unlockedCount }: AchievementsClientProps) {
    const categories = ['tasks', 'streak', 'xp', 'focus'] as const
    const progressPercentage = Math.round((unlockedCount / achievements.length) * 100)

    return (
        <div className="space-y-10 pb-12">
            {/* Header / Summary */}
            <div className="flex flex-col gap-2 border-b border-[#E9E9E8] dark:border-[#2C2C2C] pb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-[#37352F] dark:text-[#D4D4D4]">
                        Progress
                    </h2>
                    <span className="text-sm text-[#91918E] dark:text-[#818181]">
                        {progressPercentage}% Completed
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Progress
                        value={progressPercentage}
                        className="h-2 bg-[#F7F7F5] dark:bg-[#2C2C2C]"
                        indicatorClassName="bg-[#37352F] dark:bg-[#91918E]"
                    />
                    <span className="text-sm text-[#37352F] dark:text-[#D4D4D4] whitespace-nowrap min-w-[80px] text-right">
                        {unlockedCount} / {achievements.length}
                    </span>
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-10">
                {categories.map((category) => {
                    const categoryAchievements = achievements.filter(a => a.category === category)

                    if (categoryAchievements.length === 0) return null

                    return (
                        <div key={category} className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#91918E] dark:text-[#818181] pl-0.5">
                                {category}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categoryAchievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={cn(
                                            "group flex flex-col p-4 rounded-sm border transition-all",
                                            "bg-[#FFFFFF] dark:bg-[#191919]",
                                            achievement.unlocked
                                                ? "border-[#E9E9E8] dark:border-[#2C2C2C] hover:bg-[#F7F7F5] dark:hover:bg-[#2C2C2C]"
                                                : "border-dashed border-[#E9E9E8] dark:border-[#2C2C2C] opacity-70"
                                        )}
                                    >
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className={cn(
                                                "flex items-center justify-center w-10 h-10 rounded-sm shrink-0",
                                                achievement.unlocked
                                                    ? "bg-[#F7F7F5] dark:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4]"
                                                    : "bg-[#F7F7F5] dark:bg-[#2C2C2C] text-[#91918E] dark:text-[#818181]"
                                            )}>
                                                {achievement.unlocked ? achievement.icon : <Lock className="w-4 h-4" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className={cn(
                                                        "text-sm font-medium truncate",
                                                        achievement.unlocked ? "text-[#37352F] dark:text-[#D4D4D4]" : "text-[#91918E] dark:text-[#818181]"
                                                    )}>
                                                        {achievement.title}
                                                    </h4>
                                                    {achievement.unlocked && (
                                                        <Check className="w-3.5 h-3.5 text-[#37352F] dark:text-[#D4D4D4]" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#91918E] dark:text-[#818181] mt-1 text-wrap line-clamp-2">
                                                    {achievement.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2">
                                            <div className="flex items-center gap-2">
                                                <Progress
                                                    value={(achievement.progress / achievement.max) * 100}
                                                    className="h-1 bg-[#F7F7F5] dark:bg-[#2C2C2C]"
                                                    indicatorClassName={cn(
                                                        achievement.unlocked ? "bg-[#37352F] dark:bg-[#91918E]" : "bg-[#91918E]/50"
                                                    )}
                                                />
                                                <span className="text-[10px] text-[#91918E] dark:text-[#818181] font-mono shrink-0">
                                                    {achievement.progress}/{achievement.max}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}