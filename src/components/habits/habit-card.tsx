'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Flame, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { completeHabit, deleteHabit } from '@/lib/actions/habits'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Habit, HabitCompletion } from '@prisma/client'

interface HabitCardProps {
    habit: Habit & { completions: HabitCompletion[] }
}

export function HabitCard({ habit }: HabitCardProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showCheck, setShowCheck] = useState(false)
    const router = useRouter()

    // Check if completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isCompletedToday = habit.completions.some(c => {
        const completedDate = new Date(c.completedAt)
        completedDate.setHours(0, 0, 0, 0)
        return completedDate.getTime() === today.getTime()
    })

    // Build streak visualization (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        date.setHours(0, 0, 0, 0)
        return date
    })

    const completedDays = new Set(
        habit.completions.map(c => {
            const d = new Date(c.completedAt)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        })
    )

    const handleComplete = async () => {
        if (isCompletedToday) return

        setIsLoading(true)
        const result = await completeHabit(habit.id)

        if (result.success) {
            setShowCheck(true)
            setTimeout(() => setShowCheck(false), 1500)
        }

        setIsLoading(false)
        router.refresh()
    }

    const handleDelete = async () => {
        await deleteHabit(habit.id)
        router.refresh()
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn(
                "relative overflow-hidden transition-all",
                isCompletedToday && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            )}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Complete Button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleComplete}
                                disabled={isLoading || isCompletedToday}
                                className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                                    isCompletedToday
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "border-gray-300 hover:border-green-500 hover:bg-green-50"
                                )}
                            >
                                <AnimatePresence>
                                    {(isCompletedToday || showCheck) && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Check className="h-5 w-5" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            <div>
                                <h3 className="font-medium">{habit.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Flame className={cn(
                                        "h-4 w-4",
                                        habit.streakCount > 0 ? "text-orange-500" : "text-gray-400"
                                    )} />
                                    <span className="text-sm text-muted-foreground">
                                        {habit.streakCount} day streak
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Streak Visualization */}
                            <div className="flex gap-1">
                                {last7Days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-3 h-3 rounded-sm transition-colors",
                                            completedDays.has(day.getTime())
                                                ? "bg-green-500"
                                                : "bg-gray-200 dark:bg-gray-700"
                                        )}
                                        title={day.toLocaleDateString()}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
