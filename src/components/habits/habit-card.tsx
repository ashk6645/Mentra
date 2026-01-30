'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Check, Flame, Trash2, MoreVertical, Trophy, Calendar } from 'lucide-react'
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
            setTimeout(() => setShowCheck(false), 2000)
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
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="group"
        >
            <div className={cn(
                "relative overflow-hidden rounded-2xl transition-all duration-300",
                "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10",
                "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                "group-hover:-translate-y-1",
                isCompletedToday ? "ring-2 ring-green-500/20 dark:ring-green-400/20" : ""
            )}>
                {/* Progress Background Hint */}
                {isCompletedToday && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none"
                    />
                )}

                <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleComplete}
                                disabled={isLoading || isCompletedToday}
                                className={cn(
                                    "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                                    isCompletedToday
                                        ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-green-500/20 shadow-lg"
                                        : "bg-white dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:border-green-400 hover:text-green-500 dark:hover:border-green-400"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {isCompletedToday ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                            <Check className="w-7 h-7 stroke-[3]" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            animate={{ opacity: isLoading ? 0.5 : 1 }}
                                        >
                                            <div className="w-4 h-4 rounded-full border-2 border-current opacity-50" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isLoading && (
                                    <div className="absolute inset-0 rounded-2xl border-2 border-green-500/30 border-t-green-500 animate-spin" />
                                )}
                            </motion.button>

                            <div>
                                <h3 className={cn(
                                    "text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors",
                                    isCompletedToday && "text-green-700 dark:text-green-400"
                                )}>
                                    {habit.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                                        habit.currentStreak > 0
                                            ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                                    )}>
                                        <Flame className={cn("w-3.5 h-3.5", habit.currentStreak > 0 && "fill-orange-500 text-orange-500")} />
                                        <span>{habit.currentStreak} Streak</span>
                                    </div>
                                    <div className="text-xs text-neutral-400 capitalize hidden sm:block">
                                        {habit.frequency}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-white/5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-neutral-400">Last 7 Days</span>
                            <div className="flex gap-1.5">
                                {last7Days.map((day, i) => {
                                    const isCompleted = completedDays.has(day.getTime())
                                    const isToday = day.getTime() === today.getTime()

                                    return (
                                        <div
                                            key={i}
                                            className="group/day relative"
                                            title={day.toLocaleDateString()}
                                        >
                                            <div className={cn(
                                                "w-2.5 h-8 rounded-full transition-all duration-300",
                                                isCompleted
                                                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                                    : isToday
                                                        ? "bg-neutral-200 dark:bg-neutral-700 ring-1 ring-neutral-300 dark:ring-neutral-600"
                                                        : "bg-neutral-100 dark:bg-neutral-800"
                                            )} />
                                            {/* Tooltip on hover could go here */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
