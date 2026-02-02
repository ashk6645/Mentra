'use client'

import { motion } from 'framer-motion'

export function BreathingCircle() {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <motion.div
                className="w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
        </div>
    )
}
