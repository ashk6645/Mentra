'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Plus, Timer, Flame, Calendar, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
    const actions = [
        {
            label: 'New Task',
            icon: Plus,
            href: '/tasks',
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            label: 'Focus Mode',
            icon: Timer,
            href: '/focus',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            label: 'Habits',
            icon: Flame,
            href: '/habits',
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            label: 'Calendar',
            icon: Calendar,
            href: '/calendar',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'Projects',
            icon: LayoutGrid,
            href: '/projects',
            color: 'text-pink-500',
            bg: 'bg-pink-500/10'
        }
    ]

    return (
        <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider text-[10px]">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {actions.map((action) => (
                        <Link key={action.label} href={action.href} className="group">
                            <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/50 transition-all border border-transparent hover:border-border/50">
                                <div className={`p-2.5 rounded-full ${action.bg} group-hover:scale-110 transition-transform`}>
                                    <action.icon className={`h-5 w-5 ${action.color}`} />
                                </div>
                                <span className="text-xs font-medium text-center">{action.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
