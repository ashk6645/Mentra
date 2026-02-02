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
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950">
      {/* Soft radial glows */}
      <div className="absolute inset-0">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[38rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[12%] h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-[10%] h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      {/* Grid + subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0)_0,_rgba(15,23,42,1)_65%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:80px_80px]" />

      {/* Animated orbits */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 1.4, delay: 0.2, ease: 'easeOut' }}
        className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute inset-0 rounded-full border border-emerald-500/10" />
        <div className="absolute inset-8 rounded-full border border-sky-500/10" />
        <div className="absolute inset-16 rounded-full border border-violet-500/10" />

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]" />
          <div className="absolute bottom-6 left-[14%] h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.7)]" />
          <div className="absolute top-10 right-[12%] h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.6)]" />
        </motion.div>
      </motion.div>

      {/* Noise overlay for texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light [background-image:url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  )
}
