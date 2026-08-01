'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/lib/second-brain/types'
import { todayKey } from '@/lib/second-brain/date'
import { isScheduled, completionFor, currentStreak } from '@/lib/second-brain/stats'
import { SURFACE, HAIRLINE, LABEL, NUM, BAR_SPRING } from '@/lib/second-brain/ui'

interface SummaryBarProps {
    days: string[]
    habits: Habit[]
    isDone: (habitId: string, date: string) => boolean
    rangeLabel: string
}

/** Circular gauge. Reads at a glance in a way a horizontal bar of the same size doesn't. */
function Ring({ percent }: { percent: number }) {
    const R = 15
    const C = 2 * Math.PI * R

    return (
        <div className="relative h-9 w-9 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                    cx="18"
                    cy="18"
                    r={R}
                    fill="none"
                    strokeWidth={3}
                    className="stroke-black/[0.07] dark:stroke-white/[0.09]"
                />
                <motion.circle
                    cx="18"
                    cy="18"
                    r={R}
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    className={cn(
                        percent === 100 ? 'stroke-emerald-500' : 'stroke-foreground/85'
                    )}
                    strokeDasharray={C}
                    initial={false}
                    animate={{ strokeDashoffset: C - (C * percent) / 100 }}
                    transition={BAR_SPRING}
                />
            </svg>
        </div>
    )
}

function Stat({
    value,
    label,
    children,
}: {
    value: string
    label: string
    children?: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            {children}
            <div className="flex min-w-0 flex-col gap-0.5">
                <span
                    className={cn(
                        'text-[20px] font-semibold leading-none tracking-[-0.02em] text-foreground',
                        NUM
                    )}
                >
                    {value}
                </span>
                <span className="truncate text-[11px] leading-none text-muted-foreground">
                    {label}
                </span>
            </div>
        </div>
    )
}

/**
 * Three figures that answer "how am I doing" without reading the grid.
 *
 * Deliberately three, and deliberately unlabelled by icon — the reference
 * dashboards bury the signal under a row of coloured glyphs. A ring, a number and
 * a caption carry it.
 */
export function SummaryBar({ days, habits, isDone, rangeLabel }: SummaryBarProps) {
    const stats = useMemo(() => {
        const today = todayKey()

        const todayHabits = habits.filter(h => isScheduled(h, today))
        const todayDone = todayHabits.filter(h => isDone(h.id, today)).length

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
            todayDone,
            todayTotal: todayHabits.length,
            todayPercent:
                todayHabits.length === 0 ? 0 : Math.round((todayDone / todayHabits.length) * 100),
            rate: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
            best,
            bestHabitName: best > 0 && bestHabit ? bestHabit.name : null,
        }
    }, [days, habits, isDone])

    return (
        <div
            className={cn(
                'grid grid-cols-1 overflow-hidden rounded-[12px] sm:grid-cols-3',
                'divide-y sm:divide-x sm:divide-y-0',
                SURFACE,
                `divide-black/[0.07] dark:divide-white/[0.07] ${HAIRLINE}`
            )}
        >
            <Stat
                value={stats.todayTotal === 0 ? '—' : `${stats.todayDone}/${stats.todayTotal}`}
                label="Done today"
            >
                <Ring percent={stats.todayPercent} />
            </Stat>

            <Stat value={`${stats.rate}%`} label={`Completion ${rangeLabel}`}>
                <Ring percent={stats.rate} />
            </Stat>

            <Stat
                value={String(stats.best)}
                label={stats.bestHabitName ? `Day streak · ${stats.bestHabitName}` : 'No active streak'}
            >
                {/* Neutral, not amber. Completion owns the only saturated colour here. */}
                <span
                    className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px]',
                        stats.best > 0
                            ? 'bg-black/[0.05] dark:bg-white/[0.07]'
                            : 'bg-black/[0.03] opacity-40 dark:bg-white/[0.04]'
                    )}
                >
                    <Flame
                        className={cn(
                            'h-[15px] w-[15px]',
                            stats.best > 0 ? 'text-foreground/70' : 'text-foreground/40'
                        )}
                        strokeWidth={1.75}
                    />
                </span>
            </Stat>
        </div>
    )
}

export { LABEL }
