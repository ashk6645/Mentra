'use client'

import { motion } from 'framer-motion'
import { Check, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { isSameDay, subDays } from 'date-fns'

interface Habit {
    id: string
    name: string
    icon: string
    currentStreak: number
    completions: {
        completedAt: Date
    }[]
}

interface HabitsStreakWidgetProps {
    habits: Habit[]
}

export function HabitsStreakWidget({ habits }: HabitsStreakWidgetProps) {
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))

    if (!habits?.length) return null

    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Habit Streaks</h3>
            </div>

            <div className="space-y-4">
                {habits.map((habit, index) => (
                    <div key={habit.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                                <span>{habit.icon || '📝'}</span>
                                {habit.name}
                            </span>
                            <span className="text-orange-500 font-bold text-xs">
                                {habit.currentStreak} day streak
                            </span>
                        </div>

                        <div className="flex justify-between gap-1">
                            {last7Days.map((date, i) => {
                                const isCompleted = habit.completions.some(c =>
                                    isSameDay(new Date(c.completedAt), date)
                                )
                                const isToday = isSameDay(date, today)

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-8 flex-1 rounded-md flex items-center justify-center transition-all",
                                            isCompleted
                                                ? "bg-green-500/20 text-green-500"
                                                : isToday
                                                    ? "bg-muted border-2 border-dashed border-muted-foreground/30"
                                                    : "bg-muted/30 text-muted-foreground/20"
                                        )}
                                        title={date.toLocaleDateString()}
                                    >
                                        {isCompleted && <Check className="h-3 w-3" />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
