'use client'

import { motion } from 'framer-motion'
import { Inbox, Target, Calendar, TrendingUp } from 'lucide-react'

const modes = [
  {
    icon: Inbox,
    title: 'Capture without thinking',
    description: 'Brain dump everything. Mentra\'s AI sorts it.',
    example: '"Finish DSA assignment tomorrow 7pm high priority"',
    result: '→ Automatically parsed, scheduled, prioritized.',
  },
  {
    icon: Target,
    title: 'Focus on what matters today',
    description: 'Every morning, Mentra shows you 3-5 tasks. Not 20. Not "whenever." Today.',
    example: 'Start a focus session. Track your deep work.',
    result: 'Build a streak.',
  },
  {
    icon: Calendar,
    title: 'See the week ahead, not the year',
    description: 'Upcoming view shows the next 7 days. That\'s it.',
    example: 'No infinite scrolling.',
    result: 'No anxiety about tasks 6 months away.',
  },
  {
    icon: TrendingUp,
    title: 'Track progress, not perfection',
    description: 'Habits. Streaks. XP.',
    example: 'Not to gamify your life—to show you\'re moving forward.',
    result: 'Even on hard days.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-4">
            Four modes. <span className="font-semibold">One clear mind.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {modes.map((mode, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative p-8 bg-white rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:scale-110 transition-transform">
                  <mode.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {mode.description}
                  </p>
                </div>
              </div>

              <div className="pl-16 space-y-2">
                <p className="text-sm text-muted-foreground italic">
                  {mode.example}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {mode.result}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
