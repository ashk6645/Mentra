'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { AuthFeatureSlider } from '@/components/auth/auth-feature-slider'
import logo from '@/app/icon.png'

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
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 overflow-hidden bg-background">
            {/* Left Column - Feature Slider (Hidden on Mobile) */}
            <div className="hidden lg:block relative border-r border-slate-100">
                <AuthFeatureSlider />
            </div>

            {/* Right Column - Auth Form */}
            <div className="relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
                {/* Mobile Background Gradients */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none lg:hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
                    <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse delay-1000" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="z-10 w-full max-w-[400px] space-y-8"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="relative h-16 w-16 transition-transform hover:scale-105 duration-300">
                            <Image
                                src={logo}
                                alt="Mentra Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Card Container - Removed card style for cleaner look on split screen, kept simplified */}
                    <div className="relative">
                        <div className="flex flex-col space-y-2 text-center mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>

                        {children}

                        <div className="mt-8 text-center text-sm text-muted-foreground">
                            {footerLabel}{' '}
                            <Link
                                href={footerLinkHref}
                                className="font-semibold text-primary hover:underline transition-all duration-300"
                            >
                                {footerLinkText}
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Copyright/Links - Optional, pinned to bottom if needed, but keeping simple for now */}
                <div className="absolute bottom-4 text-xs text-muted-foreground hidden sm:block">
                    &copy; {new Date().getFullYear()} Mentra. All rights reserved.
                </div>
            </div>
        </div>
    )
}
