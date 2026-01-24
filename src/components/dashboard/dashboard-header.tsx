'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Cloud, Sun, Moon, Calendar } from 'lucide-react'

interface DashboardHeaderProps {
    displayName: string
    hoursRemaining?: number
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 5) return { text: 'Good late night', icon: Moon }
    if (hour < 12) return { text: 'Good morning', icon: Sun }
    if (hour < 17) return { text: 'Good afternoon', icon: Sun }
    if (hour < 22) return { text: 'Good evening', icon: Moon }
    return { text: 'Good night', icon: Moon }
}

export function DashboardHeader({ displayName, hoursRemaining }: DashboardHeaderProps) {
    const greeting = getGreeting()
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>{today}</span>
                </div>

                <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                        {greeting.text}, <span className="font-medium">{displayName}</span>
                    </h1>
                    <greeting.icon className="h-6 w-6 text-muted-foreground/50 hidden md:block" />
                </div>
            </div>

            {/* <div className="text-right hidden md:block">
                    <p className="text-sm text-muted-foreground">Work hours remaining</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{hoursRemaining}h</p>
                </div> */}
        </div>
    )
}
