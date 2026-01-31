'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, Target, Timer, Trophy } from 'lucide-react'

const features = [
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Natural language → Structured tasks',
    detail: '"Meeting with Sarah next Tuesday at 3pm about Q1 planning"',
    result: 'Mentra understands. You don\'t format.',
    color: 'from-blue-500/10 to-blue-500/5',
    accent: 'text-blue-600',
  },
  {
    id: 'pages',
    icon: FileText,
    title: 'Notion-Style Pages',
    description: 'Private workspace for notes, docs, databases.',
    detail: 'Not a second brain. A thinking space.',
    result: 'Write, organize, connect ideas.',
    color: 'from-orange-500/10 to-orange-500/5',
    accent: 'text-orange-600',
  },
  {
    id: 'habits',
    icon: Target,
    title: 'Habits & Streaks',
    description: 'Daily habits. Weekly reviews.',
    detail: 'Gentle reminders, not guilt trips.',
    result: 'Build consistency without pressure.',
    color: 'from-green-500/10 to-green-500/5',
    accent: 'text-green-600',
  },
  {
    id: 'focus',
    icon: Timer,
    title: 'Focus Mode',
    description: 'Pomodoro timer. Distraction-free view.',
    detail: 'Your tasks. Your timer. Nothing else.',
    result: 'Deep work, simplified.',
    color: 'from-purple-500/10 to-purple-500/5',
    accent: 'text-purple-600',
  },
  {
    id: 'gamification',
    icon: Trophy,
    title: 'Gamification (Done Right)',
    description: 'XP for completing tasks. Levels for consistency.',
    detail: 'No childish badges. Just momentum.',
    result: 'See your progress, feel accomplished.',
    color: 'from-yellow-500/10 to-yellow-500/5',
    accent: 'text-yellow-600',
  },
]

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0])

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:text-center mb-16 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight text-foreground mb-6">
            Everything you need. <span className="font-semibold block mt-1">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We stripped away the clutter found in other tools to leave you with a system that actually works.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[350px_1fr] gap-8 lg:gap-16 items-start">
          {/* Tabs */}
          <div className="space-y-3">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 group border ${activeFeature.id === feature.id
                    ? 'bg-secondary border-primary/10 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-muted/50'
                  }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-lg transition-colors ${activeFeature.id === feature.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                    }`}>
                    <feature.icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className={`font-medium text-lg ${activeFeature.id === feature.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>{feature.title}</span>
                </div>
                {activeFeature.id === feature.id && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-muted-foreground pl-[52px]"
                  >
                    {feature.description}
                  </motion.p>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <div className={`h-full rounded-3xl border border-border/50 bg-gradient-to-br ${activeFeature.color} p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden group`}>

                  {/* Decorative Background Icon */}
                  <activeFeature.icon className={`absolute -bottom-10 -right-10 w-96 h-96 opacity-[0.03] rotate-12 ${activeFeature.accent}`} />

                  <div className="max-w-xl relative z-10">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-black/5 ${activeFeature.accent} text-sm font-medium mb-8 shadow-sm`}>
                      <activeFeature.icon className="w-4 h-4" />
                      {activeFeature.title}
                    </div>

                    <h3 className="text-3xl lg:text-4xl font-light text-foreground mb-6 leading-tight">
                      {activeFeature.detail}
                    </h3>

                    <div className="w-16 h-1 bg-foreground/10 mb-6 rounded-full" />

                    <p className="text-xl text-muted-foreground font-medium">
                      {activeFeature.result}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
