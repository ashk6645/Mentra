'use client'

import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CircularTimerProps {
    duration: number // seconds
    onComplete?: () => void
    className?: string
    autoStart?: boolean
    onDurationChange?: (duration: number) => void
}

export function CircularTimer({ duration, onComplete, className, autoStart = false, onDurationChange }: CircularTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState(duration)
    const [isActive, setIsActive] = useState(autoStart)
    const [showDurationPicker, setShowDurationPicker] = useState(false)
    const lastFrameRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)
    const onCompleteRef = useRef(onComplete)
    const completionFiredRef = useRef(false)
    const remainingRef = useRef(duration)
    const gradientId = useId().replace(/:/g, '')

    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    const progress = duration > 0 ? (timeRemaining / duration) * 100 : 0
    const displaySeconds = Math.max(0, Math.ceil(timeRemaining - 1e-6))

    useEffect(() => {
        setTimeRemaining(duration)
        setIsActive(autoStart)
        completionFiredRef.current = false
        remainingRef.current = duration
    }, [duration, autoStart])

    useEffect(() => {
        remainingRef.current = timeRemaining
    }, [timeRemaining])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault()
                setIsActive((prev) => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const stopRaf = useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        lastFrameRef.current = null
    }, [])

    useEffect(() => {
        if (!isActive) {
            stopRaf()
            return
        }

        const tick = (now: number) => {
            if (lastFrameRef.current == null) {
                lastFrameRef.current = now
            }
            const delta = (now - lastFrameRef.current) / 1000
            lastFrameRef.current = now

            const next = Math.max(0, remainingRef.current - delta)
            remainingRef.current = next
            setTimeRemaining(next)

            if (next <= 0) {
                setIsActive(false)
                if (!completionFiredRef.current) {
                    completionFiredRef.current = true
                    onCompleteRef.current?.()
                }
                return
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        lastFrameRef.current = null
        rafRef.current = requestAnimationFrame(tick)
        return stopRaf
    }, [isActive, stopRaf])

    const toggleTimer = () => setIsActive((a) => !a)

    const resetTimer = () => {
        setIsActive(false)
        setTimeRemaining(duration)
        remainingRef.current = duration
        completionFiredRef.current = false
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

    const viewBoxSize = 100
    const strokeWidth = 2.25
    const radius = viewBoxSize / 2 - strokeWidth / 2 - 1
    const center = viewBoxSize / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className={cn('flex w-full max-w-[min(100%,20rem)] flex-col items-center gap-6 sm:gap-8', className)}>
            <div className="relative flex w-full flex-col items-center">
                <button
                    type="button"
                    className="group relative aspect-square w-[min(78vw,17.5rem)] sm:w-[min(72vw,18rem)] outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-full"
                    onClick={() => !isActive && setShowDurationPicker((v) => !v)}
                    aria-label={isActive ? 'Timer running' : 'Choose focus duration'}
                >
                    {/* Soft ambient ring — Vercel / Linear–style depth */}
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-[-8%] rounded-full opacity-0 transition-opacity duration-700',
                            isActive ? 'opacity-100' : 'opacity-40'
                        )}
                        style={{
                            background:
                                'radial-gradient(55% 55% at 50% 45%, rgba(255,255,255,0.06) 0%, transparent 70%)',
                        }}
                    />

                    <svg
                        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                        className="relative z-10 h-full w-full -rotate-90 drop-shadow-[0_1px_0_rgba(255,255,255,0.04)]"
                        aria-hidden
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
                            </linearGradient>
                        </defs>

                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={strokeWidth}
                            className="transition-[stroke] duration-500"
                        />

                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={cn(
                                'transition-[stroke-opacity] duration-300',
                                isActive ? 'stroke-opacity-100' : 'stroke-opacity-70'
                            )}
                            style={{ willChange: 'stroke-dashoffset' }}
                        />
                    </svg>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            key={displaySeconds}
                            className="font-mono text-[clamp(2.5rem,11vw,3.75rem)] font-light tabular-nums tracking-[-0.02em] text-white"
                            initial={{ opacity: 0.85, y: 1 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {formatTime(displaySeconds)}
                        </motion.span>
                        <span
                            className={cn(
                                'mt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/35',
                                isActive && 'text-white/55'
                            )}
                        >
                            {isActive ? 'Focusing' : 'Ready'}
                        </span>
                    </div>
                </button>

                <AnimatePresence>
                    {showDurationPicker && !isActive && (
                        <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute left-1/2 top-[calc(100%+0.75rem)] z-30 w-[min(100%,14rem)] -translate-x-1/2 rounded-xl border border-white/[0.08] bg-zinc-950/90 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                        >
                            <div className="grid grid-cols-2 gap-0.5 p-0.5">
                                {[15, 25, 45, 60].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => handleDurationSelect(mins * 60)}
                                        className={cn(
                                            'rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                                            duration === mins * 60
                                                ? 'bg-white text-zinc-950'
                                                : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90'
                                        )}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex w-full max-w-[16rem] items-center justify-center gap-3 sm:gap-4">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/45 hover:bg-white/[0.06] hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation()
                        resetTimer()
                    }}
                    aria-label="Reset timer"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="h-14 w-14 shrink-0 rounded-full border border-white/[0.12] bg-white/[0.06] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-transform hover:bg-white/[0.1] active:scale-[0.97] sm:h-16 sm:w-16"
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleTimer()
                    }}
                    aria-label={isActive ? 'Pause' : 'Start'}
                >
                    {isActive ? (
                        <Pause className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
                    ) : (
                        <Play className="ml-0.5 h-6 w-6 fill-current sm:h-7 sm:w-7" />
                    )}
                </Button>
            </div>

            <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                Space to {isActive ? 'pause' : 'start'}
            </p>
        </div>
    )
}
