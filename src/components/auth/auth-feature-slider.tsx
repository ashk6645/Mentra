'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Circle, CheckCircle2, Flame, Calendar, Clock } from 'lucide-react'
import Image from 'next/image'
import logo from '@/app/icon.png'

// Refined easing
const ease = [0.16, 1, 0.3, 1]

// ============================================
// SLIDE 1: Task Addition
// ============================================
function TaskAdditionSlide() {
    const [isTyping, setIsTyping] = useState(false)
    const [typedText, setTypedText] = useState('')
    const [showTask, setShowTask] = useState(false)
    const fullText = 'Prepare client presentation'

    useEffect(() => {
        const timer1 = setTimeout(() => setIsTyping(true), 800)
        const timer2 = setTimeout(() => {
            let index = 0
            const typeInterval = setInterval(() => {
                if (index <= fullText.length) {
                    setTypedText(fullText.slice(0, index))
                    index++
                } else {
                    clearInterval(typeInterval)
                    setTimeout(() => {
                        setShowTask(true)
                        setIsTyping(false)
                    }, 300)
                }
            }, 50)
        }, 1200)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [])

    return (
        <div className="w-full max-w-lg space-y-0.5">
            {/* Existing tasks */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md group hover:bg-slate-50/60 transition-colors duration-150">
                <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-slate-600">Review quarterly goals</span>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md group hover:bg-slate-50/60 transition-colors duration-150">
                <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-slate-600">Update project timeline</span>
            </div>

            {/* New task being added */}
            <AnimatePresence mode="wait">
                {isTyping && !showTask && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-indigo-50/50 rounded-md">
                            <Circle className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" strokeWidth={2} />
                            <span className="text-sm text-slate-700">
                                {typedText}
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-0.5 h-3.5 bg-indigo-600 ml-0.5 align-middle"
                                />
                            </span>
                        </div>
                    </motion.div>
                )}

                {showTask && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.25, ease }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md hover:bg-slate-50/60 transition-colors duration-150">
                            <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                            <span className="text-sm text-slate-600">{fullText}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ============================================
// SLIDE 2: Task Completion
// ============================================
function TaskCompletionSlide() {
    const [completed, setCompleted] = useState(false)
    const [count, setCount] = useState(3)

    useEffect(() => {
        const timer = setTimeout(() => {
            setCompleted(true)
            setCount(4)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-full max-w-lg space-y-0.5">
            {/* Header with count */}
            <div className="flex items-center justify-between px-3.5 py-3 mb-1">
                <h3 className="text-sm font-medium text-slate-900">Today</h3>
                <motion.span
                    key={count}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease }}
                    className="text-xs text-slate-500 font-medium"
                >
                    {count} completed
                </motion.span>
            </div>

            {/* Task being completed */}
            <motion.div
                animate={{
                    opacity: completed ? 0.4 : 1,
                }}
                transition={{ duration: 0.25, ease }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-md hover:bg-slate-50/60 transition-colors duration-150 cursor-pointer"
            >
                <motion.div
                    animate={{
                        scale: completed ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 0.3, ease }}
                >
                    {completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
                    ) : (
                        <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                    )}
                </motion.div>
                <span className={cn(
                    "text-sm transition-all duration-200",
                    completed ? "text-slate-400 line-through" : "text-slate-600"
                )}>
                    Review quarterly goals
                </span>
            </motion.div>

            {/* Other tasks */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md hover:bg-slate-50/60 transition-colors duration-150">
                <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-slate-600">Update project timeline</span>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md hover:bg-slate-50/60 transition-colors duration-150">
                <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-slate-600">Prepare client presentation</span>
            </div>
        </div>
    )
}

// ============================================
// SLIDE 3: Task Detail Panel
// ============================================
function TaskDetailSlide() {
    const [showPanel, setShowPanel] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowPanel(true), 1000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="relative w-full max-w-2xl h-[380px]">
            {/* Task list (background) */}
            <motion.div
                animate={{
                    opacity: showPanel ? 0.2 : 1,
                    x: showPanel ? -20 : 0,
                }}
                transition={{ duration: 0.35, ease }}
                className="absolute inset-0 space-y-0.5"
            >
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-indigo-50/40 rounded-md">
                    <Circle className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" strokeWidth={2} />
                    <span className="text-sm text-slate-700">Review quarterly goals</span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md">
                    <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                    <span className="text-sm text-slate-600">Update project timeline</span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md">
                    <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                    <span className="text-sm text-slate-600">Prepare client presentation</span>
                </div>
            </motion.div>

            {/* Detail panel */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="absolute right-0 top-0 bottom-0 w-[55%] bg-white border-l border-slate-200/80 rounded-r-xl shadow-2xl shadow-slate-900/5"
                    >
                        <div className="p-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <Circle className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-1.5" strokeWidth={2} />
                                <div className="flex-1">
                                    <div className="text-base font-medium text-slate-900">
                                        Review quarterly goals
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    Description
                                </label>
                                <div className="w-full text-sm bg-slate-50 border border-slate-200/50 rounded-lg p-3 min-h-[80px]">
                                    <div className="h-2.5 w-full bg-slate-200/60 rounded mb-2" />
                                    <div className="h-2.5 w-4/5 bg-slate-200/60 rounded mb-2" />
                                    <div className="h-2.5 w-3/5 bg-slate-200/60 rounded" />
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2.5 text-sm text-slate-600 px-1">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                                    <span className="text-sm">No due date</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-slate-600 px-1">
                                    <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
                                    <span className="text-sm">No priority</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ============================================
// SLIDE 4: Habit Tracking
// ============================================
function HabitTrackingSlide() {
    const [streak, setStreak] = useState(6)
    const [todayCompleted, setTodayCompleted] = useState(false)
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    useEffect(() => {
        const timer = setTimeout(() => {
            setTodayCompleted(true)
            setStreak(7)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-full max-w-lg">
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm shadow-slate-900/5">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Morning Meditation</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Daily habit</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" strokeWidth={2} />
                        <motion.span
                            key={streak}
                            initial={{ scale: 1.15, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.25, ease }}
                            className="text-2xl font-bold text-slate-900 tabular-nums"
                        >
                            {streak}
                        </motion.span>
                        <span className="text-sm text-slate-500 font-medium">day streak</span>
                    </div>
                </div>

                {/* Week view */}
                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, index) => {
                        const isCompleted = index < 6 || (index === 6 && todayCompleted)
                        const isToday = index === 6

                        return (
                            <div key={index} className="flex flex-col items-center gap-2">
                                <span className="text-xs font-medium text-slate-500">{day}</span>
                                <motion.div
                                    animate={{
                                        backgroundColor: isCompleted
                                            ? 'rgb(249 115 22)'
                                            : 'rgb(241 245 249)',
                                        scale: isToday && todayCompleted ? [1, 1.12, 1] : 1,
                                    }}
                                    transition={{ duration: 0.3, ease }}
                                    className="w-9 h-9 rounded-full flex items-center justify-center"
                                >
                                    {isCompleted && (
                                        <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                                    )}
                                </motion.div>
                            </div>
                        )
                    })}
                </div>

                {/* Progress */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-500 font-medium">Weekly progress</span>
                        <motion.span
                            key={streak}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-700 font-semibold tabular-nums"
                        >
                            {streak}/7 days
                        </motion.span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            animate={{ width: `${(streak / 7) * 100}%` }}
                            transition={{ duration: 0.4, ease }}
                            className="h-full bg-orange-500 rounded-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================
// SLIDE 5: Reminder Scheduling
// ============================================
function ReminderSchedulingSlide() {
    const [showDate, setShowDate] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowDate(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-full max-w-lg space-y-0.5">
            {/* Task with date being added */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-indigo-50/40 rounded-md">
                <Circle className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" strokeWidth={2} />
                <div className="flex-1 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-700">Team standup meeting</span>
                    <AnimatePresence mode="wait">
                        {showDate && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.25, ease }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium flex-shrink-0"
                            >
                                <Calendar className="h-3 w-3" strokeWidth={2.5} />
                                <span>Tomorrow 9:00 AM</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Other tasks */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md hover:bg-slate-50/60 transition-colors duration-150">
                <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                <div className="flex-1 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-600">Review quarterly goals</span>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium flex-shrink-0">
                        <Clock className="h-3 w-3" strokeWidth={2.5} />
                        <span>Today 2:00 PM</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-md hover:bg-slate-50/60 transition-colors duration-150">
                <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-slate-600">Update project timeline</span>
            </div>
        </div>
    )
}

// ============================================
// SLIDE 6: Calendar View
// ============================================
function CalendarViewSlide() {
    const [selectedDay, setSelectedDay] = useState(2)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    useEffect(() => {
        const timer = setTimeout(() => setSelectedDay(3), 1800)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-full max-w-lg">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm shadow-slate-900/5">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">This Week</h3>
                    <p className="text-xs text-slate-500 mt-0.5">February 2-8, 2026</p>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5 mb-5">
                    {days.map((day, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <span className="text-xs font-medium text-slate-500 mb-2">{day.slice(0, 1)}</span>
                            <motion.div
                                animate={{
                                    backgroundColor: selectedDay === index ? 'rgb(99 102 241)' : 'rgb(248 250 252)',
                                    scale: selectedDay === index ? 1.05 : 1,
                                }}
                                transition={{ duration: 0.2, ease }}
                                className="w-full aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <span className={cn(
                                    "text-sm font-semibold tabular-nums",
                                    selectedDay === index ? "text-white" : "text-slate-700"
                                )}>
                                    {index + 2}
                                </span>
                                {[2, 3, 5].includes(index) && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={cn(
                                            "w-1 h-1 rounded-full mt-1",
                                            selectedDay === index ? "bg-white" : "bg-indigo-500"
                                        )}
                                    />
                                )}
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* Events */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                    <AnimatePresence mode="wait">
                        {selectedDay === 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2, ease }}
                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                                <div className="w-1 h-12 bg-blue-500 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-900">Team Review</div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        <Clock className="h-3 w-3" strokeWidth={2} />
                                        10:00 AM - 11:00 AM
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {selectedDay === 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2, ease }}
                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                                <div className="w-1 h-12 bg-purple-500 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-900">Client Call</div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        <Clock className="h-3 w-3" strokeWidth={2} />
                                        2:00 PM - 3:00 PM
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Main Slider Component
// ============================================
const slides = [
    {
        title: 'Add tasks effortlessly',
        description: 'Type naturally and watch your tasks appear',
        component: TaskAdditionSlide,
    },
    {
        title: 'Track your progress',
        description: 'Check off tasks with satisfying feedback',
        component: TaskCompletionSlide,
    },
    {
        title: 'Dive into details',
        description: 'Click any task to view and edit',
        component: TaskDetailSlide,
    },
    {
        title: 'Build lasting habits',
        description: 'Maintain streaks with visual motivation',
        component: HabitTrackingSlide,
    },
    {
        title: 'Stay on schedule',
        description: 'Set reminders and due dates effortlessly',
        component: ReminderSchedulingSlide,
    },
    {
        title: 'Plan your week',
        description: 'See your schedule at a glance',
        component: CalendarViewSlide,
    },
]

export function AuthFeatureSlider() {
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6500)
        return () => clearInterval(timer)
    }, [])

    const CurrentComponent = slides[currentSlide].component

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center p-12 bg-white">
            {/* Minimal gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-indigo-50/30" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center h-full">
                {/* Branding */}
                <div className="absolute top-10 left-10 flex items-center gap-2.5">
                    <div className="relative h-8 w-8">
                        <Image
                            src={logo}
                            alt="Mentra"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                        Mentra
                    </span>
                </div>

                {/* Slide content */}
                <div className="flex-1 flex items-center justify-center w-full mb-16">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.4, ease }}
                            className="w-full flex items-center justify-center"
                        >
                            <CurrentComponent />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Text content */}
                <div className="text-center space-y-2 max-w-lg mb-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                                {slides[currentSlide].title}
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {slides[currentSlide].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center gap-1.5">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className="group relative"
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <div
                                className={cn(
                                    'h-1 rounded-full transition-all duration-300',
                                    index === currentSlide
                                        ? 'w-6 bg-slate-900'
                                        : 'w-1 bg-slate-300 group-hover:bg-slate-400'
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}