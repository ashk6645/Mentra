'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { ReactNode, MouseEvent } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  delay?: number
}

export function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="group relative border border-black/5 bg-white overflow-hidden rounded-2xl"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative h-full p-6">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black/[0.03] border border-black/[0.02] text-neutral-900 mb-4 group-hover:scale-110 group-hover:bg-black/[0.05] transition-all duration-300">
          {icon}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900">
            {title}
          </h3>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
