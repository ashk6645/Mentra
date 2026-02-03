'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { CheckCircle2, Calendar, Target, Zap } from 'lucide-react'

export function AppPreview() {
  const tasks = [
    { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20', label: 'Complete project proposal', sub: 'Due today · High priority', delay: 0.15, progress: 0.75 },
    { icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-500/10', glow: 'shadow-sky-500/20', label: 'Team sync — 2:00 PM', sub: 'Calendar · 30 min', delay: 0.25, progress: 0 },
    { icon: Target, color: 'text-amber-600', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/20', label: 'Daily focus session', sub: 'Pomodoro · 25 min remaining', delay: 0.35, progress: 0.5 },
    { icon: Zap, color: 'text-violet-600', bg: 'bg-violet-500/10', glow: 'shadow-violet-500/20', label: 'Review analytics overview', sub: 'Recurring · Every Monday', delay: 0.45, progress: 0.3 },
  ]

  return (
    <div className="relative group">
      {/* Ambient glow - Adjusted for Light Mode */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-4xl"
        style={{ perspective: 1000 }}
      >
        {/* Outer glow ring - Light/Purple tint */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 blur-xl opacity-50 -z-10" />

        {/* Glass container - Light Mode */}
        <div className="relative rounded-2xl border border-black/[0.08] bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Browser chrome */}
          <div className="border-b border-black/[0.05] px-5 py-3 flex items-center gap-3 bg-white/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-black/[0.1]" />
              <div className="w-2.5 h-2.5 rounded-full bg-black/[0.1]" />
              <div className="w-2.5 h-2.5 rounded-full bg-black/[0.1]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center justify-center">
                <Image
                  src="/Mentra1.png"
                  alt="Mentra"
                  width={80}
                  height={24}
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* App body */}
          <div className="p-6 space-y-5">
            {/* Dashboard header row */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-900 text-sm font-semibold tracking-[-0.01em]">Good morning, Ashu</span>
                  <span className="text-xs">👋</span>
                </div>
                <span className="text-xs text-neutral-500">You have 4 tasks scheduled today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-700 font-medium">3 completed</span>
                </div>
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: task.delay, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-black/[0.04] hover:border-black/[0.1] hover:shadow-sm transition-all duration-300 group/task"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${task.bg} border border-black/5 flex items-center justify-center`}>
                    <task.icon className={`h-4 w-4 ${task.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">{task.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{task.sub}</p>
                  </div>

                  {/* Progress ring (only when progress > 0) */}
                  {task.progress > 0 && (
                    <div className="flex-shrink-0 w-7 h-7 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" />
                        <circle
                          cx="12" cy="12" r="9" fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 9}`}
                          strokeDashoffset={`${2 * Math.PI * 9 * (1 - task.progress)}`}
                          className={task.color}
                        />
                      </svg>
                    </div>
                  )}

                  {/* Checkbox placeholder */}
                  {task.progress === 0 && (
                    <div className="flex-shrink-0 w-4.5 h-4.5 rounded-md border border-neutral-300 group-hover/task:border-neutral-400 transition-colors duration-200" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Bottom summary bar */}
            <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  {['bg-emerald-400', 'bg-sky-400', 'bg-amber-400'].map((color, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full ${color} opacity-80 border-2 border-white`} />
                  ))}
                </div>
                <span className="text-xs text-neutral-400">Focus streak: 12 days 🔥</span>
              </div>
              <span className="text-xs text-neutral-400">Updated just now</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
