'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CheckCircle2, Calendar, Shield, Square, CheckSquare } from 'lucide-react'
import Image from 'next/image'
import logo from '@/app/icon.png'

// --- Animated Components for Slides ---

function TaskListAnimation() {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Review project roadmap', completed: false },
        { id: 2, text: 'Design system update', completed: false },
        { id: 3, text: 'Client meeting', completed: false },
        { id: 4, text: 'Deploy to production', completed: false },
    ])

    useEffect(() => {
        const interval = setInterval(() => {
            setTasks((prev) => {
                const nextUncompletedIndex = prev.findIndex((t) => !t.completed)
                if (nextUncompletedIndex === -1) {
                    // Reset all
                    return prev.map((t) => ({ ...t, completed: false }))
                }
                // Complete next one
                return prev.map((t, i) =>
                    i === nextUncompletedIndex ? { ...t, completed: true } : t
                )
            })
        }, 1500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-slate-200" />
            </div>
            <div className="p-4 space-y-3">
                {tasks.map((task) => (
                    <motion.div
                        key={task.id}
                        initial={false}
                        animate={{
                            backgroundColor: task.completed
                                ? 'rgb(241 245 249)'
                                : 'white',
                            opacity: task.completed ? 0.6 : 1,
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 shadow-sm"
                    >
                        <motion.div
                            animate={{
                                scale: task.completed ? [1, 1.2, 1] : 1,
                                color: task.completed
                                    ? 'rgb(34 197 94)'
                                    : 'rgb(203 213 225)',
                            }}
                        >
                            {task.completed ? (
                                <CheckSquare className="h-5 w-5" />
                            ) : (
                                <Square className="h-5 w-5" />
                            )}
                        </motion.div>
                        <span
                            className={cn(
                                'text-sm font-medium transition-all duration-300',
                                task.completed
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-700'
                            )}
                        >
                            {task.text}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function TaskEditAnimation() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setIsOpen((prev) => !prev)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative w-full max-w-sm h-[320px] flex items-center justify-center">
            {/* Background List */}
            <div className="absolute inset-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 p-4 space-y-3 opacity-50 scale-95 origin-top">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100"
                    />
                ))}
            </div>

            {/* Active Card / Modal */}
            <motion.div
                animate={{
                    scale: isOpen ? 1 : 0.9,
                    y: isOpen ? 0 : 40,
                    opacity: isOpen ? 1 : 0,
                    zIndex: isOpen ? 20 : 0,
                }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            >
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-500 p-6 flex flex-col justify-end">
                    <div className="h-6 w-3/4 bg-white/20 rounded mb-2 backdrop-blur-sm" />
                    <div className="h-4 w-1/2 bg-white/20 rounded backdrop-blur-sm" />
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="h-8 w-20 bg-slate-100 rounded-full" />
                        <div className="h-8 w-20 bg-slate-100 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-50 rounded" />
                        <div className="h-4 w-5/6 bg-slate-50 rounded" />
                        <div className="h-4 w-4/6 bg-slate-50 rounded" />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <div className="h-10 w-24 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200" />
                    </div>
                </div>
            </motion.div>
            {/* Cursor Simulation */}
            <motion.div
                animate={{
                    x: isOpen ? 160 : 100, // Move cursor based on state
                    y: isOpen ? 250 : 100,
                    scale: isOpen ? 0.9 : 1
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute z-50 pointer-events-none"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl text-black fill-black">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" />
                </svg>
            </motion.div>
        </div>
    )
}

// --- Main Feature Config ---

const features = [
    {
        title: 'Stay on Track',
        description: 'Watch your productivity soar as you check off tasks. Simple, satisfying, and effective.',
        component: TaskListAnimation,
    },
    {
        title: 'Deep Focus Mode',
        description: 'Click into any task to enter deep work mode. All the context you need, none of the distraction.',
        component: TaskEditAnimation,
    },
    {
        title: 'Plan Your Week',
        description: 'Drag, drop, and organize your way to a perfect schedule. Scheduling made human.',
        component: () => (
            <div className="w-full max-w-sm h-[300px] bg-white rounded-xl shadow-xl border border-slate-100 p-4 grid grid-cols-7 gap-2 items-center">
                {Array.from({ length: 28 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn("aspect-square rounded-md",
                            [3, 14, 22].includes(i) ? "bg-indigo-500" :
                                [6, 18].includes(i) ? "bg-purple-400" :
                                    [0, 7, 27].includes(i) ? "bg-slate-100" :
                                        "bg-slate-50"
                        )}
                    />
                ))}
            </div>
        )
    }
]

export function AuthFeatureSlider() {
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % features.length)
        }, 6000) // Slower rotation for complex animations
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center p-8 bg-slate-50/50">
            {/* Soft Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" />

            {/* Animated Blobs (Softer colors) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        translate: ['0% 0%', '10% 10%', '0% 0%'],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        translate: ['0% 0%', '-10% -5%', '0% 0%'],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]"
                />
            </div>


            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center h-full">
                {/* Branding */}
                <div className="absolute top-8 left-8 flex items-center gap-3">
                    <div className="relative h-8 w-8">
                        <Image
                            src={logo}
                            alt="Mentra Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">Mentra</span>
                </div>

                {/* Animation Stage */}
                <div className="relative h-[400px] w-full flex items-center justify-center mb-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            {(() => {
                                const Component = features[currentSlide].component
                                return <Component />
                            })()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Text Content */}
                <div className="relative z-20 text-center space-y-4 max-w-sm">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                                {features[currentSlide].title}
                            </h2>
                            <p className="text-lg text-slate-500 leading-relaxed">
                                {features[currentSlide].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-3 mt-12">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-300',
                                index === currentSlide
                                    ? 'w-8 bg-indigo-600'
                                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
