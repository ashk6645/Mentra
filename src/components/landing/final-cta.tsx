'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-primary text-primary-foreground rounded-3xl p-12 text-center relative overflow-hidden"
        >
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
            <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-white rounded-full blur-[80px]" />
            <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-white rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight mb-6">
              Your clearest day <br /> <span className="opacity-90">starts now.</span>
            </h2>

            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed max-w-xl mx-auto font-light">
              No setup hell. No credit card required.
              <br />
              Just sign up and finally find your flow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-base h-14 px-8 rounded-full text-foreground font-semibold">
                <Link href="/signup">Get started for free</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-primary-foreground/60">
              Free for individuals. Forever.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
