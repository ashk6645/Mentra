'use client'

import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-6 leading-[1.1]">
              Your mind, organized.
              <br />
              <span className="font-semibold">Your day, clear.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Mentra is the task manager that doesn't overwhelm you.
              <br />
              Capture everything. Focus on today. Build momentum.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild className="text-base">
                <Link href="/signup">Start with a clear mind</Link>
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={scrollToHowItWorks}
                className="text-base"
              >
                See how it works
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Right: Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              {/* Placeholder for app screenshot */}
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                <div className="w-full max-w-md p-8 space-y-4">
                  {/* Mock Today View */}
                  <div className="text-sm font-semibold text-muted-foreground mb-6">Today</div>
                  
                  {[
                    { title: 'Review design mockups', time: '9:00 AM', done: true },
                    { title: 'Team standup', time: '10:30 AM', done: true },
                    { title: 'Deep work: Write landing copy', time: '2:00 PM', done: false },
                  ].map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border/50"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        task.done ? 'bg-success border-success' : 'border-muted-foreground/30'
                      }`}>
                        {task.done && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-muted-foreground">{task.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating cursor animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute top-1/2 right-8 w-6 h-6"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
