'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, ChevronRight, MoreHorizontal } from 'lucide-react'
import { CircularTimer } from './circular-timer'
import { BreathingCircle } from './breathing-circle'
import { Button } from '@/components/ui/button'
import { toggleTaskCompletion } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

interface FocusViewProps {
    tasks: any[] // Using any to match existing loose typing in other components, ideally Task type
}

export function FocusView({ tasks: initialTasks }: FocusViewProps) {
    const router = useRouter()
    const [tasks, setTasks] = useState(initialTasks)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)

    // filter out completed tasks from the flow if they are completed in this session
    // effectively, we just iterate through the list.

    const currentTask = tasks[currentIndex]
    const nextTasks = tasks.slice(currentIndex + 1, currentIndex + 3)

    const handleNext = () => {
        setIsCompleted(false)
        if (currentIndex < tasks.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            // All done logic
            router.push('/')
        }
    }

    const handleTaskCompletion = async () => {
        if (!currentTask) return

        setIsCompleted(true)
        try {
            await toggleTaskCompletion(currentTask.id, true)
            // Wait a bit for animation then move next
            setTimeout(() => {
                handleNext()
            }, 1000)
        } catch (error) {
            console.error('Failed to complete task', error)
            setIsCompleted(false)
        }
    }

    if (!currentTask) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8 text-center">
                <h1 className="text-4xl font-light mb-4">All caught up!</h1>
                <p className="text-zinc-400 mb-8">No more tasks in your queue.</p>
                <Button onClick={() => router.push('/')} variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white">
                    Return to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-white font-sans selection:bg-blue-500/30">
            {/* Ambient Background */}
            <BreathingCircle />

            {/* Header / Nav */}
            <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <Button
                    variant="ghost"
                    className="text-white/50 hover:text-white hover:bg-white/5 gap-2"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Exit Focus Mode
                </Button>
                <div className="text-sm font-medium text-white/30 tracking-widest uppercase">
                    Focus Session
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTask.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="w-full text-center space-y-12"
                    >
                        {/* Task Title */}
                        <div className="space-y-4">
                            <motion.h1
                                className="text-5xl md:text-7xl font-light tracking-tight leading-tight"
                                layoutId={`title-${currentTask.id}`}
                            >
                                {currentTask.title}
                            </motion.h1>
                            {currentTask.description && (
                                <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                                    {currentTask.description}
                                </p>
                            )}
                            <div className="flex gap-2 justify-center pt-2">
                                {currentTask.priority && (
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border",
                                        currentTask.priority === 'urgent' ? "border-red-500/50 text-red-400" :
                                            currentTask.priority === 'high' ? "border-orange-500/50 text-orange-400" :
                                                "border-blue-500/50 text-blue-400"
                                    )}>
                                        {currentTask.priority}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="py-8">
                            <CircularTimer
                                duration={25 * 60}
                                onComplete={() => {
                                    // Timer complete action - maybe sound sound or notification?
                                    // For now, we can just let the user decide to move on or take a break
                                }}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-6">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-14 px-8 rounded-full text-lg gap-2 transition-all duration-300",
                                    isCompleted
                                        ? "bg-green-500 hover:bg-green-600 text-white w-48"
                                        : "bg-white text-black hover:bg-zinc-200"
                                )}
                                onClick={handleTaskCompletion}
                                disabled={isCompleted}
                            >
                                {isCompleted ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        Completed
                                    </>
                                ) : (
                                    "Complete Task"
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 w-14 rounded-full border-white/10 hover:bg-white/10 hover:text-white p-0"
                                onClick={handleNext}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Up Next Queue */}
                <div className="absolute bottom-12 w-full max-w-md">
                    <div className="text-white/40 text-sm font-medium mb-4 uppercase tracking-widest text-center">Up Next</div>
                    <div className="space-y-3">
                        <AnimatePresence>
                            {nextTasks.map((task, i) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.1 } }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/5 p-4 rounded-lg flex items-center justify-between group"
                                >
                                    <span className="text-white/80 font-medium truncate">{task.title}</span>
                                    <span className="text-white/30 text-xs">{task.durationMinutes ? `${task.durationMinutes}m` : ''}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {nextTasks.length === 0 && (
                            <div className="text-center text-white/20 italic">No more tasks queued</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
