'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Habit } from '@/lib/second-brain/types'
import { shortDayName, dayOfMonth, todayKey, isFuture } from '@/lib/second-brain/date'
import { isScheduled, completionFor, dayCompletion, currentStreak } from '@/lib/second-brain/stats'
import { SBCheckbox } from './checkbox'
import { SURFACE, SURFACE_SOLID, HAIRLINE, LABEL, NUM, FOCUS, BAR_SPRING } from '@/lib/second-brain/ui'

interface HabitGridProps {
    days: string[]
    habits: Habit[]
    isDone: (habitId: string, date: string) => boolean
    onToggle: (habitId: string, date: string) => void
    onSelectDay?: (date: string) => void
}

const Cell = memo(function Cell({
    habitId,
    date,
    habitName,
    scheduled,
    done,
    future,
    onToggle,
}: {
    habitId: string
    date: string
    habitName: string
    scheduled: boolean
    done: boolean
    future: boolean
    onToggle: (habitId: string, date: string) => void
}) {
    if (!scheduled) {
        return (
            <td className="px-1 text-center align-middle">
                {/* A rest day is not a miss. Notion's table has only checkboxes, so an
                    unscheduled Sunday reads identically to one you skipped. */}
                <span
                    className="inline-flex h-8 w-8 items-center justify-center"
                    title={`${habitName} isn't scheduled on this day`}
                >
                    <span className="h-[3px] w-[3px] rounded-full bg-black/15 dark:bg-white/20" />
                </span>
            </td>
        )
    }

    return (
        <td className="px-1 text-center align-middle">
            <button
                type="button"
                onClick={() => onToggle(habitId, date)}
                aria-label={`${habitName} on ${date}`}
                aria-pressed={done}
                className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-[8px]',
                    'transition-colors duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                    FOCUS,
                    future && !done && 'opacity-40'
                )}
            >
                <SBCheckbox checked={done} size="sm" />
            </button>
        </td>
    )
})

/** Percentage plus a bar that springs to width. */
function RowProgress({ percent, dim }: { percent: number; dim: boolean }) {
    return (
        <div className="flex items-center justify-end gap-2.5">
            <span
                className={cn(
                    'w-8 text-right text-[11.5px]',
                    NUM,
                    dim ? 'text-muted-foreground/50' : 'text-muted-foreground'
                )}
            >
                {percent}%
            </span>
            <div className="h-[3px] w-14 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.09]">
                <motion.div
                    className={cn(
                        'h-full rounded-full',
                        percent === 100 ? 'bg-emerald-500' : 'bg-foreground/55'
                    )}
                    initial={false}
                    animate={{ width: `${percent}%` }}
                    transition={BAR_SPRING}
                />
            </div>
        </div>
    )
}

/**
 * Days as rows, habits as columns.
 *
 * Two capabilities a generic database table can't express, which is the whole
 * reason not to just use one:
 *   1. "Not scheduled" is a dot, not an unchecked box, and is excluded from the
 *      completion denominator — so a weekday habit reads 100%, not 71%.
 *   2. A live streak sits in each column header, where it actually motivates.
 */
export function HabitGrid({ days, habits, isDone, onToggle, onSelectDay }: HabitGridProps) {
    const today = todayKey()

    const perHabit = useMemo(
        () =>
            habits.map(habit => ({
                habit,
                completion: completionFor(habit, isDone, days),
                streak: currentStreak(habit, isDone),
            })),
        [habits, isDone, days]
    )

    if (habits.length === 0) {
        return (
            <div className={cn('rounded-[14px] px-6 py-16 text-center', SURFACE)}>
                <p className="text-[13.5px] text-muted-foreground">
                    No habits yet — add one to start tracking.
                </p>
            </div>
        )
    }

    return (
        <div className={cn('overflow-hidden rounded-[14px]', SURFACE)}>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className={cn('border-b', HAIRLINE)}>
                            <th
                                scope="col"
                                className={cn(
                                    // Same token as the card, so the sticky column
                                    // composites to an identical colour — no seam.
                                    'sticky left-0 z-20 px-4 py-2.5 text-left',
                                    SURFACE_SOLID
                                )}
                            >
                                <span className={LABEL}>Day</span>
                            </th>

                            {perHabit.map(({ habit, streak }) => (
                                <th key={habit.id} scope="col" className="px-1.5 py-2.5">
                                    <div className="mx-auto flex w-[88px] flex-col items-center gap-1.5">
                                        <span aria-hidden className="text-[17px] leading-none">
                                            {habit.icon}
                                        </span>
                                        <span
                                            className="line-clamp-2 text-center text-[11.5px] font-medium leading-[1.3] text-foreground/80"
                                            title={habit.name}
                                        >
                                            {habit.name}
                                        </span>
                                        {/* Neutral, so it never competes with the emerald ticks. */}
                                        <span
                                            className={cn(
                                                'flex items-center gap-0.5 text-[10px] font-semibold leading-none',
                                                NUM,
                                                streak > 0
                                                    ? 'text-muted-foreground'
                                                    : 'text-transparent select-none'
                                            )}
                                            title={streak > 0 ? `${streak} day streak` : undefined}
                                        >
                                            <span className="text-[9px]">🔥</span>
                                            {streak > 0 ? streak : 0}
                                        </span>
                                    </div>
                                </th>
                            ))}

                            <th scope="col" className="px-4 py-2.5 text-right">
                                <span className={LABEL}>Progress</span>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {days.map(day => {
                            const isToday = day === today
                            const future = isFuture(day)
                            const progress = dayCompletion(habits, isDone, day)

                            return (
                                <tr
                                    key={day}
                                    className={cn(
                                        'group border-b last:border-b-0 transition-colors',
                                        HAIRLINE,
                                        !isToday && 'hover:bg-black/[0.015] dark:hover:bg-white/[0.025]'
                                    )}
                                >
                                    <th
                                        scope="row"
                                        className={cn(
                                            'sticky left-0 z-10 py-1 pl-4 pr-3 text-left font-normal',
                                            SURFACE_SOLID
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onSelectDay?.(day)}
                                            title="Open this day"
                                            className={cn(
                                                'relative flex items-center gap-2.5 rounded-[8px] py-1 pl-2.5 pr-2 text-left transition-colors',
                                                'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                                                FOCUS,
                                                future && 'opacity-50'
                                            )}
                                        >
                                            {/* Today marker: a 2px rule, not a filled pill. Quiet
                                                enough to leave completion as the only strong colour. */}
                                            {isToday && (
                                                <span className="absolute -left-[9px] top-1/2 h-[15px] w-[2px] -translate-y-1/2 rounded-full bg-primary" />
                                            )}

                                            <span
                                                className={cn(
                                                    'w-8 text-[12.5px]',
                                                    isToday
                                                        ? 'font-semibold text-foreground'
                                                        : 'text-foreground/75'
                                                )}
                                            >
                                                {shortDayName(day)}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[12.5px]',
                                                    NUM,
                                                    isToday
                                                        ? 'font-semibold text-foreground'
                                                        : 'text-muted-foreground/70'
                                                )}
                                            >
                                                {dayOfMonth(day)}
                                            </span>
                                        </button>
                                    </th>

                                    {habits.map(habit => (
                                        <Cell
                                            key={habit.id}
                                            habitId={habit.id}
                                            date={day}
                                            habitName={habit.name}
                                            scheduled={isScheduled(habit, day)}
                                            done={isDone(habit.id, day)}
                                            future={future}
                                            onToggle={onToggle}
                                        />
                                    ))}

                                    <td className="py-1 pl-3 pr-4">
                                        <RowProgress
                                            percent={progress.percent}
                                            dim={progress.scheduled === 0}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>

                    <tfoot>
                        <tr className={cn('border-t', HAIRLINE)}>
                            <th
                                scope="row"
                                className={cn('sticky left-0 z-10 px-4 py-2.5 text-left', SURFACE_SOLID)}
                            >
                                <span className={LABEL}>Rate</span>
                            </th>

                            {perHabit.map(({ habit, completion }) => (
                                <td key={habit.id} className="px-1.5 py-2.5 text-center">
                                    <span
                                        className={cn(
                                            'text-[11.5px] font-semibold',
                                            NUM,
                                            completion.scheduled === 0
                                                ? 'text-muted-foreground/40'
                                                : completion.percent === 100
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground'
                                        )}
                                        title={`${completion.done} of ${completion.scheduled} scheduled days`}
                                    >
                                        {completion.scheduled === 0 ? '—' : `${completion.percent}%`}
                                    </span>
                                </td>
                            ))}

                            <td className="px-4 py-2.5" />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}
