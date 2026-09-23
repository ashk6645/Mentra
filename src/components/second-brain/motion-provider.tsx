'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Honour "reduce motion" across the whole section.
 *
 * With `reducedMotion="user"`, Framer drops transform and layout animation for
 * anyone who has asked their OS for less movement, and keeps the opacity fades —
 * so nothing slides or bounces, but nothing snaps jarringly either.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
