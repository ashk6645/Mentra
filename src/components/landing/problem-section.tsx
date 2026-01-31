'use client'

import { motion } from 'framer-motion'

export function ProblemSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light tracking-tight text-foreground mb-6">
              You don't need another productivity app.
              <br />
              <span className="font-semibold">You need less noise.</span>
            </h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>Notion has too many features.</p>
              <p>Todoist has too many projects.</p>
              <p>Your brain has too many tabs open.</p>
              
              <div className="pt-6 space-y-3">
                <p className="text-foreground font-medium">Mentra is different. It's opinionated. It tells you:</p>
                <ul className="space-y-2 pl-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>What to work on today</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>When to take a break</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>How to build momentum</span>
                  </li>
                </ul>
              </div>

              <p className="pt-6 text-foreground font-medium">
                No endless customization. No feature bloat.
                <br />
                Just clarity.
              </p>
            </div>
          </motion.div>

          {/* Right: Visual Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Other Apps */}
            <div className="relative">
              <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Other Apps
              </div>
              <div className="relative rounded-xl overflow-hidden border border-border/50 opacity-40 blur-[2px] grayscale">
                <div className="aspect-[4/3] bg-gradient-to-br from-neutral-100 to-neutral-200 p-6">
                  <div className="space-y-2">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="h-8 bg-neutral-300 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground/60">Too much noise</span>
              </div>
            </div>

            {/* Mentra */}
            <div>
              <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                Mentra
              </div>
              <div className="rounded-xl overflow-hidden border border-primary/20 shadow-lg">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 p-6 flex items-center justify-center">
                  <div className="space-y-3 w-full max-w-sm">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-white rounded-lg border border-border/50 shadow-sm" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center mt-3">
                <span className="text-sm font-medium text-foreground">Just what matters</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
