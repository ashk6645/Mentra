'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

const TIMER_PRESETS = {
    focus: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
}

interface PomodoroTimerProps {
    onSessionComplete?: (mode: TimerMode, duration: number) => void
    taskTitle?: string
}

export function PomodoroTimer({ onSessionComplete, taskTitle }: PomodoroTimerProps) {
    const [mode, setMode] = useState<TimerMode>('focus')
    const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.focus)
    const [isRunning, setIsRunning] = useState(false)
    const [completedPomodoros, setCompletedPomodoros] = useState(0)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3')
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    // Timer logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            handleTimerComplete()
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isRunning, timeLeft])

    const handleTimerComplete = useCallback(() => {
        setIsRunning(false)

        // Play sound
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => { })
        }

        // Notify parent
        if (onSessionComplete) {
            onSessionComplete(mode, TIMER_PRESETS[mode])
        }

        // Auto-switch modes
        if (mode === 'focus') {
            const newCount = completedPomodoros + 1
            setCompletedPomodoros(newCount)

            // Every 4 pomodoros, take a long break
            if (newCount % 4 === 0) {
                setMode('longBreak')
                setTimeLeft(TIMER_PRESETS.longBreak)
            } else {
                setMode('shortBreak')
                setTimeLeft(TIMER_PRESETS.shortBreak)
            }
        } else {
            setMode('focus')
            setTimeLeft(TIMER_PRESETS.focus)
        }
    }, [mode, completedPomodoros, soundEnabled, onSessionComplete])

    const toggleTimer = () => setIsRunning(!isRunning)

    const resetTimer = () => {
        setIsRunning(false)
        setTimeLeft(TIMER_PRESETS[mode])
    }

    const switchMode = (newMode: TimerMode) => {
        setIsRunning(false)
        setMode(newMode)
        setTimeLeft(TIMER_PRESETS[newMode])
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const progress = ((TIMER_PRESETS[mode] - timeLeft) / TIMER_PRESETS[mode]) * 100

    return (
        <Card className={cn(
            "max-w-md mx-auto transition-colors duration-500",
            mode === 'focus' && "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30",
            mode === 'shortBreak' && "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
            mode === 'longBreak' && "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
        )}>
            <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                    {mode === 'focus' ? (
                        <>
                            <Brain className="h-5 w-5 text-red-500" />
                            Focus Time
                        </>
                    ) : mode === 'shortBreak' ? (
                        <>
                            <Coffee className="h-5 w-5 text-green-500" />
                            Short Break
                        </>
                    ) : (
                        <>
                            <Coffee className="h-5 w-5 text-blue-500" />
                            Long Break
                        </>
                    )}
                </CardTitle>
                {taskTitle && (
                    <p className="text-sm text-muted-foreground mt-1">{taskTitle}</p>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Mode Selector */}
                <div className="flex gap-2 justify-center">
                    {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
                        <Button
                            key={m}
                            variant={mode === m ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => switchMode(m)}
                            className="text-xs"
                        >
                            {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short' : 'Long'}
                        </Button>
                    ))}
                </div>

                {/* Timer Display */}
                <div className="relative">
                    {/* Progress Ring */}
                    <svg className="w-48 h-48 mx-auto transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-muted/20"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={553}
                            strokeDashoffset={553 - (553 * progress) / 100}
                            className={cn(
                                "transition-all duration-1000",
                                mode === 'focus' && "text-red-500",
                                mode === 'shortBreak' && "text-green-500",
                                mode === 'longBreak' && "text-blue-500"
                            )}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Time Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
                            {completedPomodoros} pomodoros today
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                        {soundEnabled ? (
                            <Volume2 className="h-5 w-5" />
                        ) : (
                            <VolumeX className="h-5 w-5 text-muted-foreground" />
                        )}
                    </Button>

                    <Button
                        size="lg"
                        onClick={toggleTimer}
                        className={cn(
                            "w-20 h-20 rounded-full transition-all",
                            mode === 'focus' && "bg-red-500 hover:bg-red-600",
                            mode === 'shortBreak' && "bg-green-500 hover:bg-green-600",
                            mode === 'longBreak' && "bg-blue-500 hover:bg-blue-600"
                        )}
                    >
                        {isRunning ? (
                            <Pause className="h-8 w-8" />
                        ) : (
                            <Play className="h-8 w-8 ml-1" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
