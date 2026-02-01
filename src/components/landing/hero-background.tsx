'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function HeroBackground() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-white selection:bg-neutral-100">
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Moving gradients */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-indigo-50/50 via-white to-white blur-3xl opacity-40 ml-auto mr-auto max-w-6xl"
            />

            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/20 blur-[100px]"
            />

            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, 60, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[100px]"
            />
        </div>
    )
}
