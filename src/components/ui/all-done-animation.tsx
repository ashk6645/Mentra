'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function AllDoneAnimation() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Animated Checkmark Circle */}
            <div className="relative mb-8 flex items-center justify-center">
                {/* Outer Glow / Halo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        delay: 0.2,
                        duration: 0.8,
                        ease: "easeOut"
                    }}
                    className="absolute inset-0 bg-green-500/20 dark:bg-green-500/10 rounded-full blur-2xl h-32 w-32 -m-8"
                />

                {/* Main Circle */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.1
                    }}
                    className="relative flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 shadow-lg shadow-green-500/30"
                >
                    {/* Animated Path Checkmark */}
                    <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white h-10 w-10"
                    >
                        <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                                delay: 0.4,
                                duration: 0.5,
                                ease: "easeOut"
                            }}
                            d="M20 6 9 17l-5-5"
                        />
                    </motion.svg>
                </motion.div>
            </div>

            {/* Staggered Text Reveal */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-center"
            >
                <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    All clear for today!
                </h3>
                <p className="text-muted-foreground/80 text-base max-w-sm mx-auto">
                    Take a moment to celebrate.
                </p>
            </motion.div>
        </motion.div>
    )
}
