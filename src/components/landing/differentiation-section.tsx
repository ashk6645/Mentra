'use client'

import { motion } from 'framer-motion'
import { Check, X, Minus } from 'lucide-react'

export function DifferentiationSection() {
  return (
    <section className="py-32 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-6">
            Why not Notion? <span className="font-semibold">Why not Todoist?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Different tools for different mindsets. Choose the one that fits how you want to think.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="overflow-hidden mb-16"
        >
          <div className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-6 font-medium text-muted-foreground w-1/4">Feature</th>
                  <th className="text-center p-6 font-semibold text-muted-foreground w-1/4">Notion</th>
                  <th className="text-center p-6 font-semibold text-muted-foreground w-1/4">Todoist</th>
                  <th className="text-center p-6 font-bold text-primary bg-primary/5 w-1/4 border-l border-primary/10 relative">
                    Mentra
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Philosophy', notion: 'Infinite canvas', todoist: 'List management', mentra: 'Intentional focus' },
                  { label: 'Setup time', notion: 'Hours / Days', todoist: 'Minutes', mentra: 'None' },
                  { label: 'Daily planning', notion: 'Manual block building', todoist: 'Date picking', mentra: 'Guided workflow' },
                  { label: 'AI intelligence', notion: 'Content generation', todoist: 'Task parsing', mentra: 'Contextual agent' },
                  { label: 'Cognitive load', notion: 'High', todoist: 'Medium', mentra: 'Minimal' },
                  { label: 'Ideal for', notion: 'Knowledge bases', todoist: 'Capturing tasks', mentra: 'Doing work' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-6 font-medium text-foreground">{row.label}</td>
                    <td className="p-6 text-center text-muted-foreground">{row.notion}</td>
                    <td className="p-6 text-center text-muted-foreground">{row.todoist}</td>
                    <td className="p-6 text-center font-medium text-foreground bg-primary/5 border-l border-primary/10">{row.mentra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom Copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center max-w-3xl mx-auto space-y-8"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white border border-border/50">
              <h3 className="font-semibold mb-2">Notion</h3>
              <p className="text-sm text-muted-foreground">Great for wikis and docs. Too unstructured for daily execution.</p>
            </div>
            <div className="p-6 rounded-xl bg-white border border-border/50">
              <h3 className="font-semibold mb-2">Todoist</h3>
              <p className="text-sm text-muted-foreground">Great for capturing tasks. Lacks the "when" and "how" of doing them.</p>
            </div>
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 shadow-sm">
              <h3 className="font-semibold mb-2 text-primary">Mentra</h3>
              <p className="text-sm text-foreground">The bridge between planning and doing. Your daily driver.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
