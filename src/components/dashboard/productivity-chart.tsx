'use client'

import { BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'

interface WeeklyStat {
    date: Date
    count: number
}

interface ProductivityChartProps {
    weeklyStats: WeeklyStat[]
}

export function ProductivityChart({ weeklyStats }: ProductivityChartProps) {
    // Sanitize and format data
    const maxCount = Math.max(...weeklyStats.map(s => Number(s.count)), 5) // Min scale of 5

    // Normalize data to ensure we have 7 days
    // In a real app we'd fill in missing dates, but for now we'll just show what we have

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Weekly Productivity</h3>
                </div>
            </div>

            <div className="h-[200px] w-full flex items-end justify-between gap-2">
                {weeklyStats.map((stat, index) => {
                    const count = Number(stat.count)
                    const heightPercentage = (count / maxCount) * 100
                    const date = new Date(stat.date)
                    const dayName = format(date, 'EEE')

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercentage}%` }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="w-full bg-primary/20 rounded-t-sm relative group-hover:bg-primary/40 transition-colors min-h-[4px]"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                    {count} tasks
                                </div>
                            </motion.div>
                            <span className="text-xs text-muted-foreground font-medium">{dayName}</span>
                        </div>
                    )
                })}

                {weeklyStats.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Not enough data yet
                    </div>
                )}
            </div>
        </Card>
    )
}
