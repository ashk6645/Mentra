'use client'

import { motion } from 'framer-motion'

export function BreathingCircle() {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
            {/* Core Glow */}
            <motion.div
                className="w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-500/10 blur-[100px]"
                animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 12, // 4s inhale + 2s hold + 6s exhale cycle approx
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Secondary Aura */}
            <motion.div
                className="absolute w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-500/10 blur-[80px]"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
        </div>
    )
}
