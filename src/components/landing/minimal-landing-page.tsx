'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function MinimalLandingPage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/Landingpage.png"
                    alt="Background"
                    fill
                    className="object-cover object-center"
                    priority
                    quality={100}
                />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/Mentra1.png"
                            alt="Mentra"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                        <span className="text-xl font-bold tracking-tight text-slate-900">Mentra</span>
                    </Link>

                    {/* Nav buttons */}
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="font-medium text-slate-700 hover:text-slate-900 hover:bg-white/20">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button size="sm" className="font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content - Centered */}
            <main className="relative flex items-center justify-center min-h-screen px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-3xl mx-auto text-center space-y-10"
                >
                    {/* Logo (large) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <Image
                            src="/Mentra1.png"
                            alt="Mentra Logo"
                            width={120}
                            height={120}
                            className="object-contain opacity-90"
                            priority
                        />
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="space-y-6"
                    >
                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
                                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                    Focus on what
                                </span>
                                <br />
                                <span className="bg-gradient-to-b from-blue-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    truly matters
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                Mentra is an all-in-one productivity system designed for clarity, control, and calm.
                                No clutter. No stress. Just you and your work.
                            </p>
                        </div>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="pt-4"
                    >
                        <Link href="/signup">
                            <Button
                                size="lg"
                                className="h-14 px-10 text-lg font-semibold rounded-full shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 py-6">
                <div className="container mx-auto px-6">
                    <p className="text-center text-sm text-slate-500/80">
                        © 2026 Mentra. Built with focus.
                    </p>
                </div>
            </footer>
        </div>
    )
}
