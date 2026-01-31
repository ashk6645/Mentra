'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free Forever',
    price: '$0',
    description: 'Perfect for trying Mentra',
    features: [
      'Unlimited tasks',
      '3 habits',
      'Basic AI parsing',
      '1 private page',
    ],
    cta: 'Start free',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$8',
    period: '/month',
    description: 'For serious builders',
    features: [
      'Everything in Free',
      'Unlimited habits',
      'Advanced AI (task breakdown, scheduling)',
      'Unlimited pages',
      'Focus analytics',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    href: '/signup?plan=pro',
    highlighted: true,
  },
]

export function PricingSection() {
  return (
    <section className="py-32 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-4">
            Start free. <span className="font-semibold">Upgrade when you're ready.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl border ${
                plan.highlighted
                  ? 'bg-primary text-primary-foreground border-primary shadow-xl scale-105'
                  : 'bg-white border-border/50'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-primary-foreground text-primary text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-2xl font-semibold mb-2 ${
                  plan.highlighted ? 'text-primary-foreground' : 'text-foreground'
                }`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-5xl font-bold ${
                    plan.highlighted ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 shrink-0 ${
                      plan.highlighted ? 'text-primary-foreground' : 'text-primary'
                    }`} />
                    <span className={plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={plan.highlighted ? 'secondary' : 'default'}
                className="w-full"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
