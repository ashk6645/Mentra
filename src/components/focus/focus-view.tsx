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
        <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-zinc-950 text-white font-sans selection:bg-white/20">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_80%_at_50%_-10%,_rgb(24_24_27)_0%,_rgb(9_9_11)_45%,_rgb(0_0_0)_100%)]" />
            <BreathingCircle />

            <header className="relative z-50 flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pt-5 sm:pb-4">
                <Button
                    variant="ghost"
                    className="h-9 gap-2 rounded-lg px-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45 hover:bg-white/[0.06] hover:text-white sm:h-10 sm:px-3"
                    onClick={() => setPhase('pick')}
                >
                    <ArrowLeft className="h-3.5 w-3.5 opacity-70" />
                    Tasks
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-white/45 hover:bg-white/[0.06] hover:text-white sm:h-10 sm:w-10"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </header>

            <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 md:px-10">
                <div className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col items-center">
                    <div className="flex w-full shrink-0 flex-col items-center justify-center py-3 sm:py-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTask.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full text-center"
                            >
                                {currentTask.priority && (
                                    <div
                                        className={cn(
                                            'mb-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70',
                                            PRIORITY_CONFIG[currentTask.priority]?.border ??
                                                'border-white/[0.08] bg-white/[0.04]'
                                        )}
                                    >
                                        <span
                                            className={
                                                PRIORITY_CONFIG[currentTask.priority]?.color ?? 'text-white/60'
                                            }
                                        >
                                            {currentTask.priority} priority
                                        </span>
                                    </div>
                                )}

                                <h1 className="mx-auto max-w-2xl text-balance break-words text-2xl font-medium leading-snug tracking-[-0.02em] text-white/95 sm:text-3xl md:text-[2rem] md:leading-tight">
                                    {currentTask.title}
                                </h1>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2 sm:py-4">
                        <CircularTimer
                            duration={activeDuration}
                            onComplete={() => {}}
                            autoStart={false}
                            onDurationChange={setActiveDuration}
                        />
                    </div>

                    <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-6 pt-2 sm:gap-8 sm:pt-4">
                        <motion.div
                            layout
                            className="flex w-full flex-wrap items-center justify-center gap-2.5 sm:gap-3"
                        >
                            <Button
                                className={cn(
                                    'h-11 min-h-[44px] flex-1 rounded-full px-5 text-[13px] font-medium transition-colors sm:h-12 sm:min-w-[10.5rem] sm:flex-none sm:px-8 sm:text-sm',
                                    isCompleted
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                        : 'bg-white text-zinc-950 hover:bg-zinc-100'
                                )}
                                onClick={handleTaskCompletion}
                                disabled={isCompleted}
                            >
                                <AnimatePresence mode="wait">
                                    {isCompleted ? (
                                        <motion.div
                                            key="complete"
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>Done</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key="label"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="block truncate"
                                        >
                                            Complete task
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Button>

                            {!isCompleted && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 min-h-[44px] min-w-[44px] shrink-0 rounded-full border-white/[0.1] bg-white/[0.03] text-white/50 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white sm:h-12 sm:w-12"
                                    onClick={handleNext}
                                    title="Skip task"
                                    aria-label="Skip to next task"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            )}
                        </motion.div>

                        {nextTask && (
                            <div className="w-full max-w-sm px-2 text-center">
                                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                                    Up next
                                </div>
                                <div className="mt-1 truncate text-xs font-medium text-white/40 sm:text-sm">
                                    {nextTask.title}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <AmbientSoundController />
        </div>
    )
}


