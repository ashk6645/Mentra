'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
    footerLabel: string
    footerLinkText: string
    footerLinkHref: string
}

export function AuthLayout({
    children,
    title,
    subtitle,
    footerLabel,
    footerLinkText,
    footerLinkHref,
}: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Background Gradients */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
                <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="z-10 w-full max-w-md space-y-8"
            >
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 transition-transform hover:scale-105 duration-300">
                        {/* Using the SVG logo found in public directory. 
                             Ideally should be /Mentra.svg, but checking the public dir listing from earlier steps 
                             it confirms 'Mentra.svg' exists. */}
                        <Image
                            src="/Mentra.svg"
                            alt="Mentra Logo"
                            fill
                            className="object-contain dark:invert"
                            priority
                        />
                    </div>
                </div>

                {/* Card Container */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-border/50 to-border/30 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />

                    <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6 sm:p-10">
                        <div className="flex flex-col space-y-1.5 text-center mb-6">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>

                        {children}

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            {footerLabel}{' '}
                            <Link
                                href={footerLinkHref}
                                className="font-semibold text-primary decoration-primary/30 hover:underline hover:decoration-primary transition-all duration-300"
                            >
                                {footerLinkText}
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
