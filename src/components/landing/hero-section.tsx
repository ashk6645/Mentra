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
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            <h1 className="text-5xl lg:text-7xl font-medium tracking-tight text-foreground mb-8 leading-[1.1]">
              Your mind, <br /> organized.
              <br />
              <span className="text-muted-foreground font-light">Your day, clear.</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl font-light">
              Mentra is the task manager that doesn't overwhelm you.
              <br />
              Capture everything. Focus on today. Build momentum.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start">
              <Button size="lg" asChild className="text-base h-12 px-8 rounded-full">
                <Link href="/signup">Start with a clear mind</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={scrollToHowItWorks}
                className="text-base h-12 px-8 rounded-full hover:bg-muted/50"
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-white">
              {/* Placeholder for app screenshot */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Abstract UI Elements */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="w-full max-w-md p-8 space-y-4 relative z-10">
                  {/* Mock Today View */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-lg font-semibold text-foreground">Today</div>
                    <div className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">Focus Mode</div>
                  </div>


                  {[
                    { title: 'Review design mockups', time: '9:00 AM', done: true, tag: 'Design' },
                    { title: 'Team standup', time: '10:30 AM', done: true, tag: 'Meeting' },
                    { title: 'Write landing copy', time: '2:00 PM', done: false, tag: 'Work', active: true },
                  ].map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${task.active
                          ? 'bg-white border-primary/20 shadow-lg scale-[1.02]'
                          : 'bg-white/50 border-transparent'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.done ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        }`}>
                        {task.done && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </motion.svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{task.time}</span>
                          {task.tag && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground font-medium">{task.tag}</span>}
                        </div>
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
              className="absolute top-[60%] right-[10%] drop-shadow-xl z-20"
            >
              <motion.div
                animate={{
                  x: [0, -40, -40, 0],
                  y: [0, -30, -30, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1
                }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.33331 29.3333L13.1066 17.5933L22.6666 26.6666L25.3333 24L16.0266 14.9333L28 11.2L2.66665 2.66666L9.33331 29.3333Z" fill="black" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
