'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CircularTimerProps {
    duration: number // in seconds
    onComplete?: () => void
    className?: string
    autoStart?: boolean
}

export function CircularTimer({ duration, onComplete, className, autoStart = false }: CircularTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration)
    const [isActive, setIsActive] = useState(autoStart)
    const [progress, setProgress] = useState(100)

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

    // SVG parameters
    const size = 320
    const strokeWidth = 8
    const center = size / 2
    const radius = size / 2 - strokeWidth / 2
    const circumference = 2 * Math.PI * radius

    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("flex flex-col items-center gap-12", className)}>
            <div className="relative flex items-center justify-center group cursor-pointer" onClick={toggleTimer}>
                {/* Background Glow */}
                <div className={cn(
                    "absolute inset-0 rounded-full bg-blue-500/0 transition-all duration-700 blur-[80px]",
                    isActive && "bg-blue-500/10"
                )} />

                <svg width={size} height={size} className="transform -rotate-90 relative z-10 transition-transform duration-500 ease-out group-hover:scale-105">
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
                        className={cn("drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-500", isActive ? "stroke-blue-400" : "stroke-white/80")}
                    />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <motion.span
                        key={timeLeft} // Rerender animation on tick
                        className="text-7xl font-light tracking-tighter tabular-nums text-white"
                        initial={{ scale: 0.95, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {formatTime(timeLeft)}
                    </motion.span>
                    <span className={cn(
                        "mt-2 text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300",
                        isActive ? "text-blue-400" : "text-white/30"
                    )}>
                        {isActive ? 'Focusing' : 'Paused'}
                    </span>
                </div>
            </div>

            {/* Controls (Minimal) */}
            <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all"
                    onClick={(e) => { e.stopPropagation(); resetTimer() }}
                >
                    <RotateCcw className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="lg"
                    className="h-16 w-16 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white transition-all scale-100 hover:scale-110 active:scale-95"
                    onClick={(e) => { e.stopPropagation(); toggleTimer() }}
                >
                    {isActive ? (
                        <Pause className="h-6 w-6 fill-current" />
                    ) : (
                        <Play className="h-6 w-6 fill-current ml-1" />
                    )}
                </Button>
            </div>
        </div>
    )
}
