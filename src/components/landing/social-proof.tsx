'use client'

import { motion } from 'framer-motion'

export function SocialProof() {
  return (
    <section className="py-12 px-6 border-y border-border/50 bg-muted/20">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <p className="text-sm text-muted-foreground">
          Trusted by students at Stanford, builders at Y Combinator, and creators who value their time.
        </p>
      </motion.div>
    </section>
  )
}
