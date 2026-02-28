'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, ChevronRight, Maximize2, Minimize2, Play } from 'lucide-react'
import { CircularTimer } from './circular-timer'
import { BreathingCircle } from './breathing-circle'
import { AmbientSoundController } from './ambient-sound-controller'
import { Button } from '@/components/ui/button'
import { toggleTaskCompletion } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

interface FocusViewProps {
    tasks: any[]
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string; dot: string }> = {
    urgent: { label: 'Urgent', color: 'text-red-400', border: 'border-red-500/30 bg-red-500/5', dot: 'bg-red-400' },
    high:   { label: 'High',   color: 'text-orange-400', border: 'border-orange-500/30 bg-orange-500/5', dot: 'bg-orange-400' },
    medium: { label: 'Medium', color: 'text-blue-400', border: 'border-blue-500/30 bg-blue-500/5', dot: 'bg-blue-400' },
    low:    { label: 'Low',    color: 'text-slate-400', border: 'border-slate-500/30 bg-slate-500/5', dot: 'bg-slate-400' },
}

export function FocusView({ tasks: initialTasks }: FocusViewProps) {
    const router = useRouter()
    const [tasks, setTasks] = useState(initialTasks)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [phase, setPhase] = useState<'pick' | 'focus'>('pick')
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
                } else if (phase === 'focus') {
                    setPhase('pick')
                } else {
                    router.back()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router, phase])

    const handleSelectTask = (index: number) => {
        // Put selected task first, then the rest in their original order
        const selected = tasks[index]
        const rest = tasks.filter((_, i) => i !== index)
        setTasks([selected, ...rest])
        setCurrentIndex(0)
        setIsCompleted(false)
        setPhase('focus')
    }

    const handleNext = () => {
        setIsCompleted(false)
        if (currentIndex < tasks.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setPhase('pick')
        }
    }

    const handleTaskCompletion = async () => {
        if (!currentTask) return
        setIsCompleted(true)
        try {
            await toggleTaskCompletion(currentTask.id, true)
            // Remove completed task from the list after short delay
            setTimeout(() => {
                const updatedTasks = tasks.filter(t => t.id !== currentTask.id)
                setTasks(updatedTasks)
                setCurrentIndex(0)
                setIsCompleted(false)
                if (updatedTasks.length === 0) {
                    setPhase('pick')
                }
            }, 800)
        } catch (error) {
            console.error('Failed to complete task', error)
            setIsCompleted(false)
        }
    }

    // ─── Task Picker Screen ───────────────────────────────────────────────────
    if (phase === 'pick') {
        return (
            <div className="relative min-h-screen w-full bg-slate-950 text-white font-sans overflow-y-auto">
                {/* Background */}
                <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050A15] to-black pointer-events-none" />

                {/* Header */}
                <header className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4 max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        className="text-white/40 hover:text-white hover:bg-white/5 gap-2 uppercase tracking-widest text-[10px]"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back
                    </Button>
                    <div className="text-[10px] uppercase tracking-widest text-white/20 font-medium">
                        Focus Mode
                    </div>
                    <div className="w-16" /> {/* spacer */}
                </header>

                <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-16">
                    {/* Hero copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center pt-6 pb-10 space-y-3"
                    >
                        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
                            What are you focusing on?
                        </h1>
                        <p className="text-sm text-white/30">
                            {tasks.length === 0
                                ? ''
                                : `${tasks.length} task${tasks.length > 1 ? 's' : ''} remaining today`}
                        </p>
                    </motion.div>

                    {tasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-6 py-12 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <p className="text-white/40 text-sm">All tasks for today are done!</p>
                            <Button
                                onClick={() => router.push('/today')}
                                className="rounded-full bg-white text-slate-950 hover:bg-slate-200 px-6"
                            >
                                Go to Today
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.ul
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                            className="space-y-2"
                        >
                            {tasks.map((task, index) => {
                                const p = task.priority ? PRIORITY_CONFIG[task.priority] : null
                                return (
                                    <motion.li
                                        key={task.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 12 },
                                            visible: { opacity: 1, y: 0 },
                                        }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <button
                                            onClick={() => handleSelectTask(index)}
                                            className="w-full text-left group flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200"
                                        >
                                            {/* Priority dot */}
                                            <div className={cn(
                                                'w-2 h-2 rounded-full shrink-0',
                                                p ? p.dot : 'bg-white/20'
                                            )} />

                                            {/* Task info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-medium text-white/90 truncate leading-snug">
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-xs text-white/30 truncate mt-0.5">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Priority badge */}
                                            {p && (
                                                <span className={cn(
                                                    'shrink-0 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium hidden sm:inline-flex',
                                                    p.border, p.color
                                                )}>
                                                    {p.label}
                                                </span>
                                            )}

                                            {/* Focus arrow */}
                                            <Play className="h-4 w-4 text-white/20 group-hover:text-white/60 shrink-0 transition-colors" />
                                        </button>
                                    </motion.li>
                                )
                            })}
                        </motion.ul>
                    )}
                </main>
            </div>
        )
    }

    // ─── Focus Session Screen ─────────────────────────────────────────────────
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
                        You've cleared your queue. Excellent work.
                    </p>
                    <Button
                        onClick={() => setPhase('pick')}
                        className="h-12 px-8 rounded-full bg-white text-slate-950 hover:bg-slate-200 mt-8 font-medium"
                    >
                        Back to Tasks
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
                    onClick={() => setPhase('pick')}
                >
                    <ArrowLeft className="h-3 w-3" />
                    Tasks
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

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 grid grid-rows-[1fr_auto_1fr] items-center justify-items-center px-6 md:px-12 pb-12">

                {/* Top Section: Task Title */}
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
                            {currentTask.priority && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={cn(
                                        "inline-flex items-center px-3 py-1 rounded-full border text-[10px] uppercase tracking-[0.2em] font-medium mx-auto backdrop-blur-md",
                                        PRIORITY_CONFIG[currentTask.priority]?.border ?? 'border-blue-500/30 bg-blue-500/5 text-blue-400'
                                    )}
                                >
                                    <span className={PRIORITY_CONFIG[currentTask.priority]?.color ?? 'text-blue-400'}>
                                        {currentTask.priority} Priority
                                    </span>
                                </motion.div>
                            )}

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 max-w-5xl mx-auto break-words text-balance drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                {currentTask.title}
                            </h1>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Middle Section: Timer */}
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
                    <motion.div layout className="flex items-center gap-4">
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
                                    <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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

                    {/* Up Next */}
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


