'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    quote: "I used to spend 20 minutes every morning deciding what to work on. Now Mentra just tells me. It's freeing.",
    author: "Alex Chen",
    role: "Indie Maker",
  },
  {
    quote: "Finally, a productivity app that doesn't make me feel guilty. It celebrates small wins.",
    author: "Priya Sharma",
    role: "PhD Student",
  },
  {
    quote: "I tried Notion for 6 months. Too much setup. Mentra works out of the box.",
    author: "Jordan Lee",
    role: "Designer",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-8 bg-white rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all"
            >
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-2xl">"</span>
                </div>
              </div>
              
              <p className="text-lg text-foreground leading-relaxed mb-6 pt-4">
                {testimonial.quote}
              </p>
              
              <div className="border-t border-border/50 pt-4">
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
