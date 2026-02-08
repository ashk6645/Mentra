'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CircularTimerProps {
    duration: number // in seconds
    onComplete?: () => void
    className?: string
    autoStart?: boolean
    onDurationChange?: (duration: number) => void
}

export function CircularTimer({ duration, onComplete, className, autoStart = false, onDurationChange }: CircularTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration)
    const [isActive, setIsActive] = useState(autoStart)
    const [progress, setProgress] = useState(100)
    const [showDurationPicker, setShowDurationPicker] = useState(false)

    useEffect(() => {
        setTimeLeft(duration)
        setIsActive(autoStart)
        setProgress(100)
    }, [duration, autoStart])

    // Handle spacebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault()
                setIsActive(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const next = prev - 1
                    setProgress((next / duration) * 100)
                    if (next <= 0) {
                        clearInterval(interval)
                        setIsActive(false)
                        onComplete?.()
                        return 0
                    }
                    return next
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isActive, timeLeft, duration, onComplete])

    const toggleTimer = () => setIsActive(!isActive)

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(duration)
        setProgress(100)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleDurationSelect = (newDuration: number) => {
        onDurationChange?.(newDuration)
        setShowDurationPicker(false)
        setIsActive(false)
    }

    // SVG parameters
    const size = 320
    const strokeWidth = 6
    const center = size / 2
    const radius = size / 2 - strokeWidth / 2
    const circumference = 2 * Math.PI * radius

    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("flex flex-col items-center gap-12", className)}>
            <div className="relative flex items-center justify-center group">
                {/* Background Glow */}
                <div className={cn(
                    "absolute inset-0 rounded-full transition-all duration-1000 blur-[80px] opacity-40",
                    isActive ? "bg-blue-500/30" : "bg-transparent"
                )} />

                <div
                    className="relative cursor-pointer"
                    onClick={() => setShowDurationPicker(!showDurationPicker)}
                >
                    <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                        {/* Track */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth={strokeWidth}
                        />
                        {/* Progress */}
                        <motion.circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="white"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{
                                duration: 1,
                                ease: "linear"
                            }}
                            className={cn(
                                "drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500",
                                isActive ? "stroke-white" : "stroke-white/60"
                            )}
                        />
                    </svg>

                    {/* Time Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <motion.span
                            key={timeLeft}
                            className="text-7xl font-mono font-light tracking-widest tabular-nums text-white"
                            initial={{ scale: 0.95, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {formatTime(timeLeft)}
                        </motion.span>
                        <span className={cn(
                            "mt-4 text-[10px] uppercase tracking-[0.3em] font-medium transition-all duration-500",
                            isActive ? "text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]" : "text-white/30"
                        )}>
                            {isActive ? 'Session Active' : 'Paused'}
                        </span>
                    </div>
                </div>

                {/* Duration Picker Popover */}
                <AnimatePresence>
                    {showDurationPicker && !isActive && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-30 top-full mt-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl w-48"
                        >
                            <div className="grid grid-cols-2 gap-1">
                                {[15, 25, 45, 60].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => handleDurationSelect(mins * 60)}
                                        className={cn(
                                            "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                            duration === mins * 60
                                                ? "bg-white text-black"
                                                : "text-white/60 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-all"
                    onClick={(e) => { e.stopPropagation(); resetTimer() }}
                >
                    <RotateCcw className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="lg"
                    className="h-20 w-20 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all scale-100 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                    onClick={(e) => { e.stopPropagation(); toggleTimer() }}
                >
                    {isActive ? (
                        <Pause className="h-8 w-8 fill-current" />
                    ) : (
                        <Play className="h-8 w-8 fill-current ml-1" />
                    )}
                </Button>
            </div>
        </div>
    )
}
