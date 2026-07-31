'use client'

import { useMemo } from 'react'
import { Flame, Target, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/lib/second-brain/types'
import { todayKey } from '@/lib/second-brain/date'
import { isScheduled, completionFor, currentStreak } from '@/lib/second-brain/stats'

interface SummaryBarProps {
    days: string[]
    habits: Habit[]
    isDone: (habitId: string, date: string) => boolean
    /** Label for the range being summarised, e.g. "this week". */
    rangeLabel: string
}

function Stat({
    icon: Icon,
    value,
    label,
    accent,
}: {
    icon: typeof Flame
    value: string
    label: string
    accent?: string
}) {
    return (
        <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <span
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    accent ?? 'bg-neutral-100 text-muted-foreground dark:bg-neutral-800'
                )}
            >
                <Icon className="h-4 w-4" />
            </span>
            <div className="flex min-w-0 flex-col">
                <span className="text-[17px] font-semibold leading-tight tabular-nums text-foreground">
                    {value}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{label}</span>
            </div>
        </div>
    )
}

/**
 * Three numbers that answer "how am I doing" without reading the grid.
 *
 * Deliberately only three. The reference dashboards bury the signal in a footer of
 * per-column percentages; the useful summary is today's progress, the range rate,
 * and the streak worth protecting.
 */
export function SummaryBar({ days, habits, isDone, rangeLabel }: SummaryBarProps) {
    const stats = useMemo(() => {
        const today = todayKey()

        const todayHabits = habits.filter(h => isScheduled(h, today))
        const todayDone = todayHabits.filter(h => isDone(h.id, today)).length

        // Aggregate rate across every habit in the range.
        let done = 0
        let scheduled = 0
        for (const habit of habits) {
            const c = completionFor(habit, isDone, days)
            done += c.done
            scheduled += c.scheduled
        }

        const streaks = habits.map(h => currentStreak(h, isDone))
        const best = streaks.length > 0 ? Math.max(...streaks) : 0
        const bestHabit = habits[streaks.indexOf(best)]

        return {
            todayLabel: todayHabits.length === 0 ? '—' : `${todayDone}/${todayHabits.length}`,
            rate: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
            best,
            bestHabitName: best > 0 && bestHabit ? bestHabit.name : 'No active streak',
        }
    }, [days, habits, isDone])

    return (
        <div className="grid grid-cols-1 divide-y divide-neutral-200 rounded-xl border border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-neutral-800 dark:border-neutral-800">
            <Stat
                icon={CalendarCheck}
                value={stats.todayLabel}
                label="Done today"
                accent="bg-primary/10 text-primary"
            />
            <Stat
                icon={Target}
                value={`${stats.rate}%`}
                label={`Completion ${rangeLabel}`}
                accent={
                    stats.rate >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                        : undefined
                }
            />
            <Stat
                icon={Flame}
                value={stats.best > 0 ? `${stats.best}` : '0'}
                label={stats.best > 0 ? `Day streak · ${stats.bestHabitName}` : 'No active streak'}
                accent={
                    stats.best > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                        : undefined
                }
            />
        </div>
    )
}
