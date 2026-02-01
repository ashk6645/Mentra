'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Calendar,
  Target,
  Brain,
  Sparkles,
  ArrowRight,
  Inbox,
  LayoutDashboard
} from 'lucide-react'
import { LandingNav } from './landing-nav'
import { FeatureCard } from './feature-card'
import { AppPreview } from './app-preview'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 pt-28 pb-24 md:pt-32 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Focus on what
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-blue-600 to-primary/70 bg-clip-text text-transparent">
                  truly matters
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Mentra is an all-in-one productivity system designed for clarity, control, and calm.
                No clutter. No stress. Just you and your work.
              </p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href="/signup">
                <Button size="lg" className="text-base px-8 h-12 rounded-xl group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-xl border-border/50 hover:bg-secondary/50">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              {/* No credit card required · Free forever · Start in seconds */}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <AppPreview />
        </div>
      </section>

      {/* What is Mentra */}
      <section className="py-24 md:py-32 border-t border-border/40">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built for the way you work
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Mentra combines tasks, calendar, focus sessions, and habit tracking into one seamless experience.
              With intelligent AI assistance and a gamification system that actually motivates,
              staying organized has never felt this natural.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need, nothing you don't
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features wrapped in a calm, distraction-free interface
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Inbox className="h-6 w-6" />}
              title="Smart Inbox"
              description="Capture everything instantly. Organize tasks with priorities, tags, and due dates."
              delay={0}
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Time Blocking"
              description="Visualize your day with calendar integration and scheduled time blocks."
              delay={0.1}
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Focus Sessions"
              description="Built-in Pomodoro timer and distraction-free mode to help you concentrate."
              delay={0.2}
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="Habit Tracking"
              description="Build consistency with visual streak tracking and automatic reminders."
              delay={0.3}
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI Assistant"
              description="Natural language task creation and smart scheduling suggestions."
              delay={0.4}
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-6 w-6" />}
              title="Progress Dashboard"
              description="Track your productivity with tasteful gamification and meaningful insights."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 border-t border-border/40">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Ready to find your focus?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands finding clarity in their daily work
              </p>
            </div>

            <Link href="/signup">
              <Button size="lg" className="text-base px-8 h-12 rounded-xl group">
                Start Using Mentra
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/Mentra1.png"
                  alt="Mentra Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold">Mentra</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mentra. Built with focus.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
