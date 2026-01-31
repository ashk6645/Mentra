'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

export function DifferentiationSection() {
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
            Why not Notion? <span className="font-semibold">Why not Todoist?</span>
          </h2>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="overflow-x-auto mb-12"
        >
          <table className="w-full bg-white rounded-2xl border border-border/50 overflow-hidden">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-6 font-semibold text-foreground"></th>
                <th className="text-center p-6 font-semibold text-muted-foreground">Notion</th>
                <th className="text-center p-6 font-semibold text-muted-foreground">Todoist</th>
                <th className="text-center p-6 font-semibold text-primary bg-primary/5">Mentra</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Philosophy', notion: 'Infinite flexibility', todoist: 'Project management', mentra: 'Intentional focus' },
                { label: 'Learning curve', notion: 'Steep', todoist: 'Moderate', mentra: '5 minutes' },
                { label: 'Daily view', notion: 'You build it', todoist: 'Cluttered', mentra: 'Opinionated' },
                { label: 'AI assistance', notion: 'Separate tool', todoist: 'None', mentra: 'Built-in' },
                { label: 'Mental load', notion: 'High', todoist: 'Medium', mentra: 'Low' },
                { label: 'Best for', notion: 'Teams, wikis', todoist: 'Power users', mentra: 'Individuals seeking clarity' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="p-6 font-medium text-foreground">{row.label}</td>
                  <td className="p-6 text-center text-muted-foreground">{row.notion}</td>
                  <td className="p-6 text-center text-muted-foreground">{row.todoist}</td>
                  <td className="p-6 text-center font-medium text-foreground bg-primary/5">{row.mentra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Bottom Copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center max-w-2xl mx-auto space-y-4"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            Notion is a canvas. Todoist is a system.
            <br />
            <span className="text-foreground font-medium">Mentra is a guide.</span>
          </p>
          
          <div className="pt-6 space-y-2 text-muted-foreground">
            <p>If you want infinite customization, use Notion.</p>
            <p>If you want GTD methodology, use Todoist.</p>
            <p className="text-foreground font-medium">If you want to think less and do more, use Mentra.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
