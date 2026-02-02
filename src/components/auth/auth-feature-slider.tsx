'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
    CheckCircle2, 
    Calendar, 
    Square, 
    CheckSquare, 
    Plus,
    Flame,
    TrendingUp,
    Clock,
    Target,
    Zap,
    BarChart3,
    Moon,
    Sun
} from 'lucide-react'
import Image from 'next/image'
import logo from '@/app/icon.png'

// --- Animation 1: Task Addition Flow ---
function TaskAdditionAnimation() {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Review project roadmap', completed: true },
        { id: 2, text: 'Design system update', completed: false },
    ])
    const [showInput, setShowInput] = useState(false)
    const [newTaskText] = useState('Client presentation')

    useEffect(() => {
        const timer1 = setTimeout(() => setShowInput(true), 1000)
        const timer2 = setTimeout(() => {
            setTasks(prev => [...prev, { id: 3, text: newTaskText, completed: false }])
            setShowInput(false)
        }, 3000)
        const timer3 = setTimeout(() => {
            setTasks([
                { id: 1, text: 'Review project roadmap', completed: true },
                { id: 2, text: 'Design system update', completed: false },
            ])
        }, 5000)
        
        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
        }
    }, [])

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
                <h3 className="text-lg font-bold">Today's Tasks</h3>
                <p className="text-sm text-indigo-100">Monday, Feb 2</p>
            </div>
            <div className="p-5 space-y-3">
                <AnimatePresence mode="popLayout">
                    {tasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                                task.completed 
                                    ? "bg-green-50 border-green-200" 
                                    : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                            )}
                        >
                            <motion.div
                                animate={{
                                    scale: task.completed ? [1, 1.3, 1] : 1,
                                }}
                                className={task.completed ? "text-green-600" : "text-slate-400"}
                            >
                                {task.completed ? (
                                    <CheckCircle2 className="h-6 w-6" />
                                ) : (
                                    <Square className="h-6 w-6" />
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-sm font-medium flex-1",
                                task.completed ? "text-slate-500 line-through" : "text-slate-800"
                            )}>
                                {task.text}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add Task Input */}
                <AnimatePresence>
                    {showInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-indigo-400 bg-indigo-50">
                                <Plus className="h-6 w-6 text-indigo-600" />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    className="flex-1"
                                >
                                    <div className="text-sm font-medium text-slate-800">
                                        {newTaskText}
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="inline-block w-0.5 h-4 bg-indigo-600 ml-1"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Button */}
                {!showInput && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm font-medium">Add Task</span>
                    </motion.button>
                )}
            </div>
        </div>
    )
}

// --- Animation 2: Habit Tracking Streak ---
function HabitTrackingAnimation() {
    const [streak, setStreak] = useState(0)
    const [days] = useState([
        { day: 'M', completed: true },
        { day: 'T', completed: true },
        { day: 'W', completed: true },
        { day: 'T', completed: false },
        { day: 'F', completed: false },
        { day: 'S', completed: false },
        { day: 'S', completed: false },
    ])

    useEffect(() => {
        const interval = setInterval(() => {
            setStreak(prev => (prev + 1) % 8)
        }, 800)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold">Morning Meditation</h3>
                        <p className="text-sm text-orange-100">Daily habit</p>
                    </div>
                    <Flame className="h-10 w-10" />
                </div>
                <div className="flex items-baseline gap-2">
                    <motion.span
                        key={Math.min(streak, 7)}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-bold"
                    >
                        {Math.min(streak, 7)}
                    </motion.span>
                    <span className="text-lg text-orange-100">day streak</span>
                </div>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-6">
                    {days.map((item, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">{item.day}</span>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ 
                                    scale: index < streak ? 1 : (item.completed ? 1 : 0.9),
                                    rotate: index < streak ? 0 : (item.completed ? 0 : -180),
                                    backgroundColor: index < streak 
                                        ? 'rgb(249 115 22)' 
                                        : (item.completed ? 'rgb(249 115 22)' : 'rgb(226 232 240)')
                                }}
                                transition={{ 
                                    delay: index * 0.1,
                                    type: 'spring',
                                    damping: 15
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                            >
                                {(index < streak || item.completed) && (
                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                )}
                            </motion.div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Weekly progress</span>
                        <span className="text-sm font-bold text-orange-600">
                            {Math.min(streak, 7)}/7 days
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <motion.div
                            animate={{ width: `${(Math.min(streak, 7) / 7) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-600 rounded-full"
                        />
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <Target className="h-5 w-5 text-slate-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">21</div>
                        <div className="text-xs text-slate-500">Best Streak</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <TrendingUp className="h-5 w-5 text-slate-500 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">85%</div>
                        <div className="text-xs text-slate-500">Completion</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Animation 3: Task Detail Edit ---
function TaskEditAnimation() {
    const [isOpen, setIsOpen] = useState(false)
    const [priority, setPriority] = useState('medium')

    useEffect(() => {
        const interval = setInterval(() => {
            setIsOpen(prev => !prev)
            if (!isOpen) {
                setTimeout(() => {
                    setPriority(prev => 
                        prev === 'low' ? 'medium' : prev === 'medium' ? 'high' : 'low'
                    )
                }, 1500)
            }
        }, 4000)
        return () => clearInterval(interval)
    }, [isOpen])

    const priorityColors = {
        low: 'bg-blue-500',
        medium: 'bg-yellow-500',
        high: 'bg-red-500'
    }

    return (
        <div className="relative w-full max-w-md h-[420px] flex items-center justify-center">
            {/* Background List */}
            <div className="absolute inset-0 w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-3 opacity-40 scale-95">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
                ))}
            </div>

            {/* Task Detail Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="absolute w-full bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden z-10"
                    >
                        <div className="h-32 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-6 flex flex-col justify-end relative overflow-hidden">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.5, 0.3]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"
                            />
                            <h3 className="text-white text-xl font-bold relative z-10">
                                Design System Update
                            </h3>
                            <p className="text-purple-100 text-sm relative z-10">
                                Due today at 5:00 PM
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Priority Selector */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <motion.button
                                            key={p}
                                            animate={{
                                                scale: priority === p ? 1.05 : 1,
                                                opacity: priority === p ? 1 : 0.5
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-medium text-white text-sm capitalize transition-all",
                                                priorityColors[p as keyof typeof priorityColors],
                                                priority === p && "ring-2 ring-offset-2 ring-slate-900"
                                            )}
                                        >
                                            {p}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                                    Description
                                </label>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-slate-100 rounded-full" />
                                    <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
                                    <div className="h-3 w-4/6 bg-slate-100 rounded-full" />
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                    Design
                                </span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                    Urgent
                                </span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200"
                            >
                                Save Changes
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Animated Cursor */}
            <motion.div
                animate={{
                    x: isOpen ? 180 : 80,
                    y: isOpen ? 280 : 60,
                    scale: isOpen ? 0.9 : 1
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute z-50 pointer-events-none"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-2xl">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="black" />
                </svg>
            </motion.div>
        </div>
    )
}

// --- Animation 4: Calendar Week View ---
function CalendarAnimation() {
    const [selectedDay, setSelectedDay] = useState(0)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const events = [
        { day: 0, title: 'Team Meeting', time: '9:00 AM', color: 'bg-blue-500' },
        { day: 0, title: 'Design Review', time: '2:00 PM', color: 'bg-purple-500' },
        { day: 2, title: 'Client Call', time: '10:00 AM', color: 'bg-green-500' },
        { day: 4, title: 'Project Demo', time: '3:00 PM', color: 'bg-orange-500' },
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setSelectedDay(prev => (prev + 1) % 7)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-xl font-bold">This Week</h3>
                        <p className="text-sm text-blue-100">February 2-8, 2026</p>
                    </div>
                    <Calendar className="h-8 w-8" />
                </div>
            </div>

            <div className="p-5">
                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                    {days.map((day, index) => (
                        <motion.div
                            key={index}
                            animate={{
                                scale: selectedDay === index ? 1.1 : 1,
                                backgroundColor: selectedDay === index ? 'rgb(37 99 235)' : 'rgb(241 245 249)'
                            }}
                            className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                        >
                            <span className={cn(
                                "text-xs font-medium mb-1",
                                selectedDay === index ? "text-white" : "text-slate-500"
                            )}>
                                {day}
                            </span>
                            <span className={cn(
                                "text-lg font-bold",
                                selectedDay === index ? "text-white" : "text-slate-900"
                            )}>
                                {index + 2}
                            </span>
                            {events.some(e => e.day === index) && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                        "w-1 h-1 rounded-full mt-1",
                                        selectedDay === index ? "bg-white" : "bg-blue-500"
                                    )}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Events List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                        Scheduled Events
                    </h4>
                    <AnimatePresence mode="popLayout">
                        {events
                            .filter(event => event.day === selectedDay)
                            .map((event, index) => (
                                <motion.div
                                    key={`${event.day}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
                                >
                                    <div className={cn("w-1 h-12 rounded-full", event.color)} />
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-slate-900">{event.title}</h5>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {event.time}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                    </AnimatePresence>
                    {events.filter(e => e.day === selectedDay).length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-slate-400"
                        >
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No events scheduled</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}

// --- Animation 5: Productivity Analytics ---
function ProductivityAnalytics() {
    const [activeMetric, setActiveMetric] = useState(0)
    const metrics = [
        { label: 'Tasks Completed', value: 24, max: 30, icon: CheckCircle2, color: 'from-green-500 to-emerald-600' },
        { label: 'Focus Time', value: 6.5, max: 8, icon: Zap, color: 'from-yellow-500 to-orange-600', suffix: 'hrs' },
        { label: 'Habits Streak', value: 12, max: 14, icon: Flame, color: 'from-orange-500 to-red-600', suffix: 'days' },
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveMetric(prev => (prev + 1) % metrics.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const currentMetric = metrics[activeMetric]
    const percentage = (currentMetric.value / currentMetric.max) * 100

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className={cn(
                "bg-gradient-to-br p-6 text-white transition-all duration-500",
                currentMetric.color
            )}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Weekly Overview</h3>
                    <BarChart3 className="h-8 w-8" />
                </div>
                <p className="text-sm opacity-90">Feb 2 - Feb 8, 2026</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Main Metric Display */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeMetric}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className={cn(
                                "inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br mb-4",
                                currentMetric.color
                            )}
                        >
                            <currentMetric.icon className="h-10 w-10 text-white" />
                        </motion.div>
                        <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                            {currentMetric.label}
                        </h4>
                        <div className="flex items-baseline justify-center gap-2">
                            <motion.span
                                key={currentMetric.value}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl font-bold text-slate-900"
                            >
                                {currentMetric.value}
                            </motion.span>
                            {currentMetric.suffix && (
                                <span className="text-xl text-slate-500">{currentMetric.suffix}</span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            of {currentMetric.max} {currentMetric.suffix || 'goal'}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mt-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={cn("h-full bg-gradient-to-r rounded-full", currentMetric.color)}
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Metric Indicators */}
                <div className="flex justify-center gap-2">
                    {metrics.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveMetric(index)}
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                index === activeMetric
                                    ? 'w-8 bg-slate-900'
                                    : 'w-2 bg-slate-300'
                            )}
                        />
                    ))}
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-900">+23%</div>
                        <div className="text-xs text-slate-500">vs last week</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Target className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-900">89%</div>
                        <div className="text-xs text-slate-500">Goal achieved</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Animation 6: Focus Mode Timer ---
function FocusModeAnimation() {
    const [isActive, setIsActive] = useState(false)
    const [time, setTime] = useState(25 * 60) // 25 minutes in seconds
    const [mode, setMode] = useState<'focus' | 'break'>('focus')

    useEffect(() => {
        const timer = setTimeout(() => setIsActive(true), 500)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime(prev => {
                    if (prev <= 1) {
                        setMode(m => m === 'focus' ? 'break' : 'focus')
                        return mode === 'focus' ? 5 * 60 : 25 * 60
                    }
                    return prev - 1
                })
            }, 50) // Faster for demo
        }
        return () => clearInterval(interval)
    }, [isActive, time, mode])

    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60
    const progress = ((totalTime - time) / totalTime) * 100

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className={cn(
                "p-6 text-white transition-all duration-1000",
                mode === 'focus' 
                    ? "bg-gradient-to-br from-indigo-600 to-blue-600" 
                    : "bg-gradient-to-br from-green-600 to-emerald-600"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold">
                            {mode === 'focus' ? 'Focus Session' : 'Break Time'}
                        </h3>
                        <p className="text-sm opacity-90">Stay concentrated</p>
                    </div>
                    {mode === 'focus' ? (
                        <Zap className="h-8 w-8" />
                    ) : (
                        <Moon className="h-8 w-8" />
                    )}
                </div>
            </div>

            <div className="p-8 flex flex-col items-center">
                {/* Circular Timer */}
                <div className="relative w-56 h-56 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="112"
                            cy="112"
                            r="100"
                            stroke="rgb(241 245 249)"
                            strokeWidth="12"
                            fill="none"
                        />
                        <motion.circle
                            cx="112"
                            cy="112"
                            r="100"
                            stroke={mode === 'focus' ? 'rgb(79 70 229)' : 'rgb(16 185 129)'}
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progress / 100 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                strokeDasharray: 2 * Math.PI * 100,
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            key={`${minutes}-${seconds}`}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-bold text-slate-900"
                        >
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </motion.div>
                        <p className="text-sm text-slate-500 mt-2">
                            {mode === 'focus' ? 'minutes remaining' : 'break time'}
                        </p>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3 w-full">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsActive(!isActive)}
                        className={cn(
                            "flex-1 py-3 rounded-xl font-semibold text-white shadow-lg transition-all",
                            mode === 'focus'
                                ? "bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-200"
                                : "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-200"
                        )}
                    >
                        {isActive ? 'Pause' : 'Start'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                    >
                        Reset
                    </motion.button>
                </div>

                {/* Session Info */}
                <div className="w-full mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Session</span>
                        <span className="font-semibold text-slate-900">3/4 completed</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div className="w-3/4 bg-gradient-to-r from-indigo-600 to-blue-600 h-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Main Feature Config ---
const features = [
    {
        title: 'Add Tasks Effortlessly',
        description: 'Create and organize your tasks in seconds. Watch them come to life with smooth animations.',
        component: TaskAdditionAnimation,
        gradient: 'from-indigo-600 to-purple-600'
    },
    {
        title: 'Build Powerful Habits',
        description: 'Track your daily routines and watch your streaks grow. Consistency made visual and rewarding.',
        component: HabitTrackingAnimation,
        gradient: 'from-orange-500 to-pink-600'
    },
    {
        title: 'Deep Task Focus',
        description: 'Click into any task for full details. Edit, prioritize, and manage everything in one beautiful view.',
        component: TaskEditAnimation,
        gradient: 'from-violet-500 to-purple-600'
    },
    {
        title: 'Master Your Schedule',
        description: 'Visualize your entire week at a glance. Drag, drop, and organize with intuitive calendar views.',
        component: CalendarAnimation,
        gradient: 'from-blue-600 to-cyan-600'
    },
    {
        title: 'Track Your Progress',
        description: 'Beautiful analytics show how productive you\'ve been. See your achievements grow over time.',
        component: ProductivityAnalytics,
        gradient: 'from-green-500 to-emerald-600'
    },
    {
        title: 'Stay in the Zone',
        description: 'Pomodoro-style focus sessions help you work smarter. Time your deep work and breaks perfectly.',
        component: FocusModeAnimation,
        gradient: 'from-indigo-600 to-blue-600'
    }
]

export function AuthFeatureSlider() {
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % features.length)
        }, 7000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: ['-10%', '10%', '-10%'],
                        y: ['-10%', '10%', '-10%'],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        x: ['10%', '-10%', '10%'],
                        y: ['10%', '-10%', '10%'],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-[100px]"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center h-full">
                {/* Branding */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute top-8 left-8 flex items-center gap-3"
                >
                    <div className="relative h-10 w-10">
                        <Image
                            src={logo}
                            alt="Mentra Logo"
                            fill
                            className="object-contain drop-shadow-lg"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                        Mentra
                    </span>
                </motion.div>

                {/* Animation Stage */}
                <div className="relative h-[500px] w-full flex items-center justify-center mb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.08, y: -20 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
                <div className="relative z-20 text-center space-y-3 max-w-md px-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.4 }}
                        >
                            <motion.h2
                                className={cn(
                                    "text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r bg-clip-text text-transparent",
                                    features[currentSlide].gradient
                                )}
                            >
                                {features[currentSlide].title}
                            </motion.h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {features[currentSlide].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mt-10">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={cn(
                                'h-2 rounded-full transition-all duration-500 relative overflow-hidden',
                                index === currentSlide
                                    ? 'w-12 bg-gradient-to-r ' + features[index].gradient
                                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            {index === currentSlide && (
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 7, ease: 'linear' }}
                                    className="absolute inset-0 bg-white/30"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Feature Count */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-sm text-slate-500"
                >
                    {currentSlide + 1} of {features.length}
                </motion.div>
            </div>
        </div>
    )
}