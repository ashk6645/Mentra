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
  },
  {
    id: 'pages',
    icon: FileText,
    title: 'Notion-Style Pages',
    description: 'Private workspace for notes, docs, databases.',
    detail: 'Not a second brain. A thinking space.',
    result: 'Write, organize, connect ideas.',
  },
  {
    id: 'habits',
    icon: Target,
    title: 'Habits & Streaks',
    description: 'Daily habits. Weekly reviews.',
    detail: 'Gentle reminders, not guilt trips.',
    result: 'Build consistency without pressure.',
  },
  {
    id: 'focus',
    icon: Timer,
    title: 'Focus Mode',
    description: 'Pomodoro timer. Distraction-free view.',
    detail: 'Your tasks. Your timer. Nothing else.',
    result: 'Deep work, simplified.',
  },
  {
    id: 'gamification',
    icon: Trophy,
    title: 'Gamification (Done Right)',
    description: 'XP for completing tasks. Levels for consistency.',
    detail: 'No childish badges. Just momentum.',
    result: 'See your progress, feel accomplished.',
  },
]

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0])

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-4">
            Everything you need. <span className="font-semibold">Nothing you don't.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Tabs */}
          <div className="space-y-2">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  activeFeature.id === feature.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/50 hover:bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-semibold">{feature.title}</span>
                </div>
                <p className={`text-sm ${
                  activeFeature.id === feature.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}>
                  {feature.description}
                </p>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <div className="h-full rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 p-12 flex flex-col justify-center">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                      <activeFeature.icon className="w-4 h-4" />
                      {activeFeature.title}
                    </div>
                    
                    <p className="text-2xl font-light text-foreground mb-4 leading-relaxed">
                      {activeFeature.detail}
                    </p>
                    
                    <p className="text-lg text-muted-foreground">
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
