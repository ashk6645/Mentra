'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { CircularTimer } from './circular-timer'
import { BreathingCircle } from './breathing-circle'
import { AmbientSoundController } from './ambient-sound-controller'
import { Button } from '@/components/ui/button'
import { toggleTaskCompletion } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

interface FocusViewProps {
    tasks: any[]
}

export function FocusView({ tasks: initialTasks }: FocusViewProps) {
    const router = useRouter()
    const [tasks, setTasks] = useState(initialTasks)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const [activeDuration, setActiveDuration] = useState(25 * 60)

    const currentTask = tasks[currentIndex]
    const nextTask = tasks[currentIndex + 1]

    // Handle Fullscreen Toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullscreen(false)
            }
        }
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen()
                    setIsFullscreen(false)
                } else {
                    router.back()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router])

    const handleNext = () => {
        setIsCompleted(false)
        if (currentIndex < tasks.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            router.push('/today')
        }
    }

    const handleTaskCompletion = async () => {
        if (!currentTask) return

        setIsCompleted(true)
        try {
            await toggleTaskCompletion(currentTask.id, true)
            setTimeout(() => {
                handleNext()
            }, 800)
        } catch (error) {
            console.error('Failed to complete task', error)
            setIsCompleted(false)
        }
    }

    if (!currentTask) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-8 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md space-y-8"
                >
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-light tracking-tight">Session Complete</h1>
                    <p className="text-slate-400 leading-relaxed">
                        You've cleared your queue. excellent work.
                    </p>
                    <Button
                        onClick={() => router.push('/today')}
                        className="h-12 px-8 rounded-full bg-white text-slate-950 hover:bg-slate-200 mt-8 font-medium"
                    >
                        Return
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans selection:bg-blue-500/30 flex flex-col">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050A15] to-black" />
            <BreathingCircle />

            {/* Header */}
            <header className="relative z-50 p-6 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity duration-500">
                <Button
                    variant="ghost"
                    className="text-white/40 hover:text-white hover:bg-white/5 gap-2 uppercase tracking-widest text-[10px]"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-3 w-3" />
                    Exit
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/40 hover:text-white hover:bg-white/5"
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </header>

            {/* Main Content Area - Grid to lock layout and prevent overlap */}
            <main className="relative z-10 flex-1 grid grid-rows-[1fr_auto_1fr] items-center justify-items-center px-6 md:px-12 pb-12">

                {/* Top Section: Task Title (Centered vertically in top third) */}
                <div className="w-full max-w-4xl flex flex-col items-center justify-end h-full pb-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTask.id}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-center space-y-6"
                        >
                            {/* Priority Badge */}
                            {currentTask.priority && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={cn(
                                        "inline-flex items-center px-3 py-1 rounded-full border text-[10px] uppercase tracking-[0.2em] font-medium mx-auto backdrop-blur-md",
                                        currentTask.priority === 'urgent' ? "border-red-500/30 text-red-400 bg-red-500/5" :
                                            currentTask.priority === 'high' ? "border-orange-500/30 text-orange-400 bg-orange-500/5" :
                                                "border-blue-500/30 text-blue-400 bg-blue-500/5"
                                    )}
                                >
                                    {currentTask.priority} Priority
                                </motion.div>
                            )}

                            {/* Title - Responsive typography, non-breaking words if possible */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 max-w-5xl mx-auto break-words text-balance drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                {currentTask.title}
                            </h1>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Middle Section: Timer (Hero) */}
                <div className="py-8">
                    <CircularTimer
                        duration={activeDuration}
                        className="scale-90 md:scale-100"
                        onComplete={() => { }}
                        autoStart={false}
                        onDurationChange={setActiveDuration}
                    />
                </div>

                {/* Bottom Section: Actions & Queue */}
                <div className="w-full max-w-lg flex flex-col items-center justify-start h-full pt-8 space-y-12">

                    {/* Primary Action */}
                    <motion.div
                        layout
                        className="flex items-center gap-4"
                    >
                        <Button
                            className={cn(
                                "h-14 px-8 rounded-full text-base font-medium transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
                                isCompleted
                                    ? "bg-emerald-500 text-white w-48 hover:bg-emerald-600 border-emerald-400/20"
                                    : "bg-white text-zinc-950 hover:bg-zinc-200"
                            )}
                            onClick={handleTaskCompletion}
                            disabled={isCompleted}
                        >
                            <AnimatePresence mode="wait">
                                {isCompleted ? (
                                    <motion.div
                                        key="complete"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Done</span>
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="label"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        Complete Task
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>

                        {!isCompleted && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-14 w-14 rounded-full border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                                onClick={handleNext}
                                title="Skip Task"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        )}
                    </motion.div>

                    {/* Up Next (Minimalist) */}
                    {nextTask && (
                        <div className="text-center space-y-2 opacity-0 hover:opacity-100 transition-opacity duration-500 delay-200">
                            <div className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Up Next</div>
                            <div className="text-sm text-white/40 font-light truncate max-w-xs mx-auto">
                                {nextTask.title}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Ambient Controls */}
            <AmbientSoundController />
        </div>
    )
}
