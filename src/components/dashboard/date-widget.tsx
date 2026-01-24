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

        // If today has activity: Active streak includes today. Look back (streak - 1) days.
        // If today NO activity: Active streak ends yesterday. Look back (streak) days.
        const todayActive = hasActivity(today)
        const daysToLookBack = todayActive ? currentStreak : currentStreak + 1

        // Check if date is within the streak range
        for (let i = 1; i < daysToLookBack; i++) {
            const streakDate = subDays(today, i)
            if (isSameDay(checkDate, streakDate)) {
                return true
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
                        background-color: hsl(20, 100%, 96%); /* Very light orange background */
                        color: hsl(20, 100%, 50%); /* Orange text */
                        border-radius: 0.375rem;
                        font-weight: 500;
                    }
                    .calendar-today-default {
                        border: 2px solid hsl(20, 100%, 50%);
                        color: hsl(20, 100%, 50%);
                        border-radius: 0.375rem;
                        font-weight: 600;
                    }
                    .calendar-today-active {
                        background-color: hsl(20, 100%, 50%); /* Solid orange */
                        color: white !important;
                        border-radius: 0.375rem;
                        font-weight: 700;
                        border: 2px solid hsl(20, 100%, 50%);
                    }
                    /* Dark mode adjustments */
                    .dark .calendar-streak {
                        background-color: hsl(20, 80%, 15%);
                        color: hsl(20, 90%, 60%);
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
                {!loading && activityDates.length > 0 && (
                    <div className="px-4 pb-3" />
                )}
            </CardContent>
        </Card>
    )
}
