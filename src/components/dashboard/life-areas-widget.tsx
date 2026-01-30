'use client'

import { motion } from 'framer-motion'
import { PieChart, List, MoreHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Area {
    id: string
    name: string
    icon: string
    color: string
    _count: {
        tasks: number
    }
}

interface LifeAreasWidgetProps {
    areas: Area[]
}

export function LifeAreasWidget({ areas }: LifeAreasWidgetProps) {
    if (!areas?.length) {
        return (
            <Card className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-medium">No Life Areas</h3>
                    <p className="text-sm text-muted-foreground">Define balanced areas in your settings</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Life Areas</h3>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {areas.map((area, index) => (
                    <motion.div
                        key={area.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-300"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <span className="text-2xl">{area.icon || '🎯'}</span>
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {area._count.tasks}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium truncate">{area.name}</h4>
                                <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(area._count.tasks * 10, 100)}%`,
                                            backgroundColor: area.color
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    )
}
