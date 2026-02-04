'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

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
        <div className="min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/Landingpage.png"
                    alt="Background"
                    fill
                    className="object-cover object-center"
                    priority
                    quality={100}
                />
            </div>

            {/* Main Auth Container */}
            <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="z-10 w-full max-w-[440px] space-y-8"
                >
                    {/* Logo - Mobile Only */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col items-center mb-8 lg:mb-12"
                    >
                        <div className="relative h-16 w-16 mb-4 transition-transform hover:scale-110 duration-300">
                            <Image
                                src={logo}
                                alt="Mentra Logo"
                                fill
                                className="object-contain drop-shadow-lg"
                                priority
                            />
                        </div>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight"
                        >
                            Mentra
                        </motion.h1>
                    </motion.div>

                    {/* Auth Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative bg-gradient-to-br from-white/95 via-blue-50/80 to-indigo-50/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 p-8 sm:p-10"
                    >
                        {/* Gradient Border Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-transparent to-blue-400/20 opacity-100 pointer-events-none" />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex flex-col space-y-2 text-center mb-8">
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent"
                                >
                                    {title}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-slate-600 text-base"
                                >
                                    {subtitle}
                                </motion.p>
                            </div>

                            {/* Form Content */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {children}
                            </motion.div>

                            {/* Footer Link */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 text-center text-sm text-slate-600"
                            >
                                {footerLabel}{' '}
                                <Link
                                    href={footerLinkHref}
                                    className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 relative group"
                                >
                                    {footerLinkText}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300" />
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center justify-center gap-6 text-xs text-slate-500 px-4"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Secure & Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            <span>Free</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Footer Copyright */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-4 text-xs text-slate-400 hidden sm:block"
                >
                    &copy; {new Date().getFullYear()} Mentra. All rights reserved.
                </motion.div>
            </div>
        </div>
    )
}