'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { useState, useEffect } from 'react'
import { getActivityDates, getStreakInfo } from '@/lib/actions/activity'
import { isSameDay, startOfDay, subDays, isToday } from 'date-fns'
import { Flame } from 'lucide-react'

export function DateWidget() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [activityDates, setActivityDates] = useState<Date[]>([])
    const [currentStreak, setCurrentStreak] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const [activityResult, streakResult] = await Promise.all([
                getActivityDates(),
                getStreakInfo(),
            ])

            if (activityResult.success) {
                setActivityDates(activityResult.dates)
            }

            if (streakResult.success) {
                setCurrentStreak(streakResult.currentStreak)
            }

            setLoading(false)
        }

        fetchData()
    }, [])

    // Check if a date has activity
    const hasActivity = (day: Date) => {
        return activityDates.some(activityDate =>
            isSameDay(startOfDay(activityDate), startOfDay(day))
        )
    }

    // Check if a date is part of current streak (excluding today)
    const isInCurrentStreak = (day: Date) => {
        if (currentStreak === 0) return false
        if (isToday(day)) return false // Today is handled separately

        const today = startOfDay(new Date())
        const checkDate = startOfDay(day)

        // Check if date is within the last N days (where N = currentStreak)
        for (let i = 1; i < currentStreak; i++) { // Start from 1 to exclude today
            const streakDate = subDays(today, i)
            if (isSameDay(checkDate, streakDate)) {
                return hasActivity(day)
            }
        }

        return false
    }

    // Check if today has activity (potential streak continuation)
    const isTodayWithActivity = (day: Date) => {
        return isToday(day) && hasActivity(day)
    }

    return (
        <Card className="border-none shadow-sm bg-card overflow-hidden">
            {/* <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Calendar</CardTitle>
            </CardHeader> */}
            <CardContent className="p-0">
                <style jsx global>{`
                    .calendar-streak {
                        background-color: var(--muted);
                        color: var(--foreground);
                        border-radius: 0.375rem;
                    }
                    .calendar-today-default {
                        border: 2px dotted var(--foreground);
                        border-radius: 0.375rem;
                    }
                    .calendar-today-active {
                        background-color: var(--muted);
                        color: var(--foreground);
                        border-radius: 0.375rem;
                        border: 2px solid var(--muted);
                    }
                `}</style>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-none w-full flex justify-center p-3"
                    classNames={{
                        head_cell: "text-muted-foreground font-normal text-[0.8rem]",
                        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors relative",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "font-semibold",
                    }}
                    modifiers={{
                        streak: (day) => isInCurrentStreak(day),
                        todayDefault: (day) => isToday(day) && !hasActivity(day),
                        todayActive: (day) => isToday(day) && hasActivity(day),
                    }}
                    modifiersClassNames={{
                        streak: "calendar-streak",
                        todayDefault: "calendar-today-default",
                        todayActive: "calendar-today-active",
                    }}
                />
                {!loading && (
                    <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
                        <div className="flex items-center justify-center gap-4">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 rounded bg-muted"></span>
                                Streak
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 rounded border-2 border-dotted border-foreground"></span>
                                Today
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
