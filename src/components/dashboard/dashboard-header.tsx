'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Calendar, Sparkles, Flame, TrendingUp, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'

interface DashboardHeaderProps {
    displayName: string
    level: number
    currentXP: number
    streak: number
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 5) return { text: 'Still up late', icon: '🌙', color: 'text-indigo-400' }
    if (hour < 12) return { text: 'Good morning', icon: '☀️', color: 'text-amber-400' }
    if (hour < 17) return { text: 'Good afternoon', icon: '🌤️', color: 'text-orange-400' }
    if (hour < 22) return { text: 'Good evening', icon: '🌆', color: 'text-purple-400' }
    return { text: 'Good night', icon: '🌙', color: 'text-indigo-400' }
}

export function DashboardHeader({ displayName, level, currentXP, streak }: DashboardHeaderProps) {
    const greeting = getGreeting()
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    // XP calculation for level progression
    const xpForNextLevel = level * 1000
    const xpProgress = (currentXP / xpForNextLevel) * 100

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-6"
        >
            {/* Top Row: Date & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{today}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowCommandPalette(true)}
                    >
                        <Command className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Quick Actions</span>
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">AI Assistant</span>
                    </Button>
                </div>
            </div>

            {/* Main Greeting & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Greeting Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <span className="text-4xl">{greeting.icon}</span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">
                                {greeting.text}, <span className="font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{displayName}</span>
                            </h1>
                        </motion.div>
                        
                        <p className="text-muted-foreground text-sm sm:text-base ml-14">
                            Ready to make today productive and balanced?
                        </p>
                    </div>

                    {/* Level Progress Bar */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-2 max-w-2xl"
                    >
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="font-medium">Level {level}</span>
                            </div>
                            <span className="text-muted-foreground tabular-nums">
                                {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                            </span>
                        </div>
                        
                        <div className="relative">
                            <Progress 
                                value={xpProgress} 
                                className="h-2 bg-muted"
                            />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {/* Streak Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-500/10 via-background to-background p-4 hover:shadow-lg transition-all duration-300 group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative space-y-1">
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Daily Streak</p>
                            </div>
                            <p className="text-3xl font-bold tabular-nums">{streak}</p>
                            <p className="text-xs text-muted-foreground">days in a row 🔥</p>
                        </div>
                    </motion.div>

                    {/* Today's Focus Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 hover:shadow-lg transition-all duration-300 group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative space-y-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Focus Score</p>
                            </div>
                            <p className="text-3xl font-bold tabular-nums">87%</p>
                            <p className="text-xs text-muted-foreground">better than yesterday ✨</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}
