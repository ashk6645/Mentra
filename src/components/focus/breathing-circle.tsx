'use client'

import { motion } from 'framer-motion'

export function BreathingCircle() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <motion.div
                className="h-[min(42vw,28rem)] w-[min(42vw,28rem)] rounded-full bg-white/[0.03] blur-[120px]"
                animate={{
                    scale: [0.92, 1.05, 0.92],
                    opacity: [0.35, 0.55, 0.35],
                }}
                transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute h-[min(32vw,22rem)] w-[min(32vw,22rem)] rounded-full bg-white/[0.02] blur-[90px]"
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1.5,
                }}
            />
        </div>
    )
}
