'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Flame } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Habit {
    id: string
    name: string
    currentStreak: number
    completedToday?: boolean
}

interface HabitsWidgetProps {
    habits?: Habit[]
}

export function HabitsWidget({ habits = [] }: HabitsWidgetProps) {
    return (
        <Card className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Daily Habits</CardTitle>
                <Link href="/habits" className="text-xs text-primary hover:underline">View All</Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {habits.length > 0 ? (
                    habits.slice(0, 3).map((habit) => (
                        <div key={habit.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${habit.completedToday ? 'bg-green-500/10' : 'bg-muted'} transition-colors`}>
                                    <Check className={`h-3 w-3 ${habit.completedToday ? 'text-green-600' : 'text-muted-foreground'}`} />
                                </div>
                                <span className={`text-sm font-medium ${habit.completedToday ? 'text-muted-foreground line-through decoration-border' : ''}`}>{habit.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-500/5 px-1.5 py-0.5 rounded-md">
                                <Flame className="h-3 w-3" />
                                <span>{habit.currentStreak}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                        <p className="mb-2">No habits tracked yet</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                            <Link href="/habits">Add Habit</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
