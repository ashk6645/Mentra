'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const logos = [
  { name: 'Y Combinator', src: '/images/logos/yc.png' }, // You would need these assets or use text for now
  { name: 'Stanford', src: '/images/logos/stanford.png' },
]

export function SocialProof() {
  return (
    <section className="py-10 px-6 border-b border-border/50 bg-white/50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Trusted by thinkers at
        </p>

        {/* Placeholder Logos - using text for now to avoid broken images if assets don't exist */}
        <div className="flex flex-wrap items-center gap-8 md:gap-12 grayscale">
          <span className="text-lg font-bold text-muted-foreground/80">Stanford</span>
          <span className="text-lg font-bold text-muted-foreground/80">YCombinator</span>
          <span className="text-lg font-bold text-muted-foreground/80">Google</span>
          <span className="text-lg font-bold text-muted-foreground/80">Notion</span>
          <span className="text-lg font-bold text-muted-foreground/80">Figma</span>
        </div>
      </div>
    </section>
  )
}
