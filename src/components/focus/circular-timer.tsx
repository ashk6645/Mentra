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
}

export function CircularTimer({ duration, onComplete, className }: CircularTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration)
    const [isActive, setIsActive] = useState(false)
    const [progress, setProgress] = useState(100)

    useEffect(() => {
        setTimeLeft(duration)
        setIsActive(false)
        setProgress(100)
    }, [duration])

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
    const size = 300
    const strokeWidth = 12
    const center = size / 2
    const radius = size / 2 - strokeWidth / 2
    const circumference = 2 * Math.PI * radius

    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("flex flex-col items-center gap-8", className)}>
            <div className="relative flex items-center justify-center">
                {/* Background Circle */}
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress Circle */}
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
                    />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-light tracking-tight tabular-nums">
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="lg"
                    className="h-16 w-16 rounded-full border border-white/20 hover:bg-white/10 hover:text-white"
                    onClick={toggleTimer}
                >
                    {isActive ? (
                        <Pause className="h-8 w-8 fill-current" />
                    ) : (
                        <Play className="h-8 w-8 fill-current ml-1" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full text-white/50 hover:text-white hover:bg-white/10"
                    onClick={resetTimer}
                >
                    <RotateCcw className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
