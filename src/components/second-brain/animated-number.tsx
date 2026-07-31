'use client'

import { useEffect, useRef } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'

interface AnimatedNumberProps {
    value: number
    suffix?: string
    className?: string
}

/**
 * A number that counts to its new value instead of snapping.
 *
 * Percentages jumping 60 → 80 the instant a box is ticked is the small thing that
 * makes an interface feel like a spreadsheet. Rolling the digits ties the number to
 * the action that changed it.
 *
 * Writes to the DOM node directly rather than through React state — this renders in
 * every grid row and footer cell, and re-rendering the tree ~30 times per second
 * per cell would cost far more than the effect is worth.
 */
export function AnimatedNumber({ value, suffix = '', className }: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const motionValue = useMotionValue(value)
    const reduceMotion = useReducedMotion()

    useEffect(() => {
        const node = ref.current
        if (!node) return

        // Respect the OS setting — a counting animation is exactly the kind of
        // motion people disable it for.
        if (reduceMotion) {
            node.textContent = `${Math.round(value)}${suffix}`
            motionValue.set(value)
            return
        }

        const controls = animate(motionValue, value, {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
            onUpdate: latest => {
                node.textContent = `${Math.round(latest)}${suffix}`
            },
        })

        return () => controls.stop()
    }, [value, suffix, motionValue, reduceMotion])

    // Server render and first paint show the real value, so there's no flash of 0.
    return (
        <span ref={ref} className={className}>
            {Math.round(value)}
            {suffix}
        </span>
    )
}
