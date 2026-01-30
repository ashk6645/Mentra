'use client'

import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AIInsightsWidgetProps {
    userId: string
    completedToday: number
    todayTasksCount: number
}

export function AIInsightsWidget({
    userId,
    completedToday,
    todayTasksCount
}: AIInsightsWidgetProps) {
    // Calculate completion rate
    const completionRate = todayTasksCount > 0
        ? Math.round((completedToday / (completedToday + todayTasksCount)) * 100)
        : 0

    // Generate dynamic insights
    const insights = getInsights(completionRate, completedToday, todayTasksCount)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
        >
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />

                <div className="relative p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">AI Insights</h3>
                                <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" className="gap-2">
                            <span className="text-xs">View All</span>
                        </Button>
                    </div>

                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="group relative rounded-lg border bg-card/50 backdrop-blur-sm p-4 hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                                        insight.color
                                    )}>
                                        <insight.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-tight">{insight.title}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {insight.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}

function getInsights(completionRate: number, completed: number, remaining: number) {
    const insights = []

    // Performance insight
    if (completionRate >= 70) {
        insights.push({
            icon: TrendingUp,
            title: "Great momentum!",
            description: `You're ${completionRate}% done for today. Keep it up!`,
            color: "bg-green-500/10 text-green-500"
        })
    } else if (remaining > 5) {
        insights.push({
            icon: AlertCircle,
            title: "High task load",
            description: `${remaining} tasks remaining. Consider prioritizing or rescheduling.`,
            color: "bg-amber-500/10 text-amber-500"
        })
    } else {
        insights.push({
            icon: Lightbulb,
            title: "Stay focused",
            description: "You have a manageable workload today. Take it one task at a time.",
            color: "bg-blue-500/10 text-blue-500"
        })
    }

    // Time-based insight
    const hour = new Date().getHours()
    if (hour < 12 && remaining > 0) {
        insights.push({
            icon: Lightbulb,
            title: "Morning advantage",
            description: "Tackle your high-priority tasks now while your focus is peak.",
            color: "bg-purple-500/10 text-purple-500"
        })
    } else if (hour >= 17 && remaining > 3) {
        insights.push({
            icon: AlertCircle,
            title: "Evening stretch",
            description: "Consider moving some tasks to tomorrow for better work-life balance.",
            color: "bg-orange-500/10 text-orange-500"
        })
    } else {
        insights.push({
            icon: TrendingUp,
            title: "On track",
            description: "Your pace is steady. Maintain this rhythm for the rest of the day.",
            color: "bg-cyan-500/10 text-cyan-500"
        })
    }

    // Streak/motivation insight
    insights.push({
        icon: Lightbulb,
        title: "Build your streak",
        description: "Complete at least one task today to maintain your productivity momentum.",
        color: "bg-pink-500/10 text-pink-500"
    })

    return insights
}
