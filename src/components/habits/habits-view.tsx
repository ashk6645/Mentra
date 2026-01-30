'use client'

import { Habit, HabitCompletion } from '@prisma/client'
import { HabitCard } from './habit-card'
import { motion, LayoutGroup } from 'framer-motion'
import { CreateHabitDialog } from './create-habit-dialog'
import { Target, Calendar, Trophy, Zap, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect } from 'react'

interface HabitsViewProps {
    habits: (Habit & { completions: HabitCompletion[] })[]
}

export function HabitsView({ habits }: HabitsViewProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const stats = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const total = habits.length
        const completed = habits.filter(h =>
            h.completions.some(c => {
                const d = new Date(c.completedAt)
                d.setHours(0, 0, 0, 0)
                return d.getTime() === today.getTime()
            })
        ).length

        const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

        // Calculate current total streak (sum of all streaks)
        const totalStreak = habits.reduce((acc, h) => acc + h.currentStreak, 0)

        return { total, completed, progress, totalStreak }
    }, [habits])

    const todayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    if (!mounted) return null

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 overflow-y-auto">
            {/* Header Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {/* Date & Welcome Card */}
                <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-8 shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                        <div>
                            <div className="flex items-center gap-2 text-white/60 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium uppercase tracking-wider">Today's Overview</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{todayDate}</h1>
                            <p className="text-white/70 max-w-md">
                                "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
                            </p>
                        </div>

                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold">{stats.completed}/{stats.total}</span>
                                <span className="text-sm text-white/50">Habits Done</span>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold flex items-center gap-1">
                                    {stats.totalStreak} <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                </span>
                                <span className="text-sm text-white/50">Total Streak Days</span>
                            </div>
                        </div>
                    </div>

                    {/* Decor glow */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />

                    {/* Ring Progress (Decorative) */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    className="text-white/10"
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="58"
                                    cx="64"
                                    cy="64"
                                />
                                <circle
                                    className="text-green-500 transition-all duration-1000 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray={365}
                                    strokeDashoffset={365 - (365 * stats.progress) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="58"
                                    cx="64"
                                    cy="64"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <span className="text-2xl font-bold">{stats.progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Mini Stats */}
                <div className="flex flex-col gap-4">
                    <div className="flex-1 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl origin-center" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-3">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg">Keep it up!</h3>
                            <p className="text-sm text-muted-foreground mt-1">You're making great progress.</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-neutral-900 rounded-3xl p-1 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <CreateHabitDialog>
                            <button className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors gap-2 p-4 cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-sm">New Habit</span>
                            </button>
                        </CreateHabitDialog>
                    </div>
                </div>
            </motion.div>

            {/* Habits Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-semibold tracking-tight">Your Habits</h2>
                    <span className="text-sm text-muted-foreground">{habits.length} habits • {stats.completed} completed today</span>
                </div>

                <LayoutGroup>
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    >
                        {habits.map(habit => (
                            <HabitCard key={habit.id} habit={habit} />
                        ))}

                        {habits.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center text-muted-foreground bg-neutral-50/50 dark:bg-neutral-900/50"
                            >
                                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                    <Target className="h-8 w-8 opacity-20" />
                                </div>
                                <h3 className="text-lg font-semibold">No Habits Yet</h3>
                                <p className="max-w-sm mx-auto mt-2 mb-6">
                                    Create your first habit to start building better routines and tracking your progress.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </LayoutGroup>
            </div>
        </div>
    )
}
