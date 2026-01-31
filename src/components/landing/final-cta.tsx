'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="py-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-6">
          Your clearest day <span className="font-semibold">starts now.</span>
        </h2>
        
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          No credit card. No setup hell.
          <br />
          Just sign up and add your first task.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="text-base">
            <Link href="/signup">Get started free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link href="#demo">Watch 2-min demo</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
