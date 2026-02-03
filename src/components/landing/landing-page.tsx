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
                <span className="bg-gradient-to-b from-primary via-blue-600 to-primary/80 bg-clip-text text-transparent">
                  truly matters
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The intelligent task manager that combines AI, projects, and Notion-style pages in one calm workspace.
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
            </motion.div>

            {/* Trust Line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              No credit card required · Free forever
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

      {/* Value Proposition */}
      <section className="py-24 md:py-32 border-t border-border/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-6 mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Why people switch to Mentra
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A productivity system that actually helps you get things done, without the overwhelm.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition Cards */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI That Actually Helps"
              description="Natural language task input, smart breakdowns, and intelligent scheduling that adapts to how you work."
              delay={0}
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-6 w-6" />}
              title="Tasks + Pages Together"
              description="Combine actionable tasks with Notion-style pages. Context and execution in one place."
              delay={0.1}
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Designed for Focus"
              description="A calm interface that helps you concentrate. No clutter, no distractions, just your work."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-24 md:py-32 border-t border-border/20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-32">
            {/* Feature 1: Natural Language Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6">
                <h3 className="text-3xl font-bold tracking-tight">
                  Just type what you need to do
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  No forms, no fields. Just natural language. Mentra understands context and automatically organizes your tasks.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">AI extracts dates, priorities, and projects automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Works the way you think, not how software demands</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Capture ideas in seconds, organize them later</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-xl border border-border/50 bg-secondary/30 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Natural Language Input Demo</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: AI Task Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="relative order-2 md:order-1">
                <div className="aspect-[4/3] rounded-xl border border-border/50 bg-secondary/30 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">AI Task Breakdown Demo</p>
                </div>
              </div>
              <div className="space-y-6 order-1 md:order-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  Break down complex projects instantly
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Overwhelmed by a big task? Let AI break it into manageable steps with smart suggestions.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">AI suggests logical subtasks and sequences</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Estimates time and effort automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Turn vague ideas into actionable plans</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Feature 3: Notion-style Pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6">
                <h3 className="text-3xl font-bold tracking-tight">
                  Tasks meet knowledge, beautifully
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Rich pages for notes, docs, and planning. Connected to your tasks. Everything in context.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <LayoutDashboard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Rich text editor with blocks and embeds</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <LayoutDashboard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Link tasks directly to project documentation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <LayoutDashboard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">No more switching between tools</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-xl border border-border/50 bg-secondary/30 overflow-hidden group/image">
                  <Image
                    src="/NotionStyle.png"
                    alt="Notion-style Pages - Rich text editor with tasks integration"
                    width={800}
                    height={600}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover/image:scale-105"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Loved by focused builders
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border/50 space-y-4"
            >
              <p className="text-muted-foreground leading-relaxed">
                "Finally, a task manager that doesn't feel like work. The AI features actually save me time instead of adding complexity."
              </p>
              <div>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-muted-foreground">Product Designer</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border/50 space-y-4"
            >
              <p className="text-muted-foreground leading-relaxed">
                "The combination of tasks and pages is genius. I can plan and execute in the same place without context switching."
              </p>
              <div>
                <p className="font-semibold">Marcus Rodriguez</p>
                <p className="text-sm text-muted-foreground">Indie Developer</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border/50 space-y-4"
            >
              <p className="text-muted-foreground leading-relaxed">
                "Mentra's calm interface helps me focus. No overwhelming features, just what I need to get things done."
              </p>
              <div>
                <p className="font-semibold">Emily Watson</p>
                <p className="text-sm text-muted-foreground">Content Creator</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-indigo-50/50 to-purple-50/50">
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
                Ready to focus?
              </h2>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-base px-8 h-12 rounded-xl group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo and Tagline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <Image
                    src="/Mentra1.png"
                    alt="Mentra Logo"
                    width={32}
                    height={32}
                    className="object-contain brightness-0 invert"
                  />
                </div>
                <span className="text-xl font-bold text-white">Mentra</span>
              </div>
              <p className="text-sm text-gray-400">
                Focus on what truly matters
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} Mentra. Built with focus.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
