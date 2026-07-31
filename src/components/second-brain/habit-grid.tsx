'use client'

import { memo, useMemo } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/lib/second-brain/types'
import { shortDayName, dayOfMonth, todayKey, isFuture } from '@/lib/second-brain/date'
import { isScheduled, completionFor, dayCompletion, currentStreak } from '@/lib/second-brain/stats'

interface HabitGridProps {
    days: string[]
    habits: Habit[]
    isDone: (habitId: string, date: string) => boolean
    onToggle: (habitId: string, date: string) => void
    /** Clicking a day label jumps to that day's detailed view. */
    onSelectDay?: (date: string) => void
}

/** A single grid cell: tickable when scheduled, an inert dash when not. */
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
            <td className="px-1 py-0 text-center align-middle">
                {/* A dash, not an empty box. Notion's table cannot tell "wasn't
                    scheduled" apart from "didn't do it" — every cell is a checkbox,
                    so rest days read as failures. */}
                <span
                    className="inline-flex h-7 w-7 items-center justify-center text-neutral-300 dark:text-neutral-700"
                    title={`${habitName} isn't scheduled on this day`}
                >
                    <Minus className="h-3 w-3" />
                </span>
            </td>
        )
    }

    return (
        <td className="px-1 py-0 text-center align-middle">
            <button
                type="button"
                onClick={() => onToggle(habitId, date)}
                aria-label={`${habitName} on ${date}`}
                aria-pressed={done}
                className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-[7px] border transition-all duration-150',
                    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    done
                        ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-800',
                    future && !done && 'opacity-45'
                )}
            >
                {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>
        </td>
    )
})

/** Compact percentage + bar, used in the row and footer. */
function MiniBar({ percent, muted = false }: { percent: number; muted?: boolean }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <span
                className={cn(
                    'w-9 text-right text-[11px] tabular-nums',
                    muted ? 'text-muted-foreground' : 'text-foreground'
                )}
            >
                {percent}%
            </span>
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-700/60">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-300',
                        percent === 100 ? 'bg-emerald-500' : 'bg-primary'
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}

/**
 * Days as rows, habits as columns — the layout that makes patterns visible.
 *
 * Two things this does that a generic database table can't:
 *   1. Distinguishes "not scheduled" from "not done", so rest days aren't misses.
 *   2. Shows a live streak per habit in the header, where it's actually motivating.
 *
 * The first two columns are sticky so the day stays readable once enough habits
 * exist to scroll horizontally.
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
            <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center dark:border-neutral-800">
                <p className="text-[14px] text-muted-foreground">
                    No habits yet — add one to start tracking.
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full border-collapse text-[13px]">
                <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <th
                            scope="col"
                            className="sticky left-0 z-10 bg-neutral-50/70 px-3 py-2.5 text-left font-medium text-muted-foreground backdrop-blur dark:bg-neutral-900/40"
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-wider">Day</span>
                        </th>

                        {perHabit.map(({ habit, streak }) => (
                            <th key={habit.id} scope="col" className="px-1.5 py-2 text-center font-medium">
                                <div className="mx-auto flex w-[84px] flex-col items-center gap-1">
                                    <span aria-hidden className="text-base leading-none">
                                        {habit.icon}
                                    </span>
                                    {/* Wrap to two lines rather than truncating — "Read 20 pages"
                                        and "Deep work block" are unreadable clipped, and the
                                        column is the only place the name appears in this view. */}
                                    <span
                                        className="line-clamp-2 text-[11px] leading-tight text-muted-foreground"
                                        title={habit.name}
                                    >
                                        {habit.name}
                                    </span>
                                    {streak > 0 && (
                                        <span
                                            className="text-[10px] font-semibold tabular-nums text-amber-600 dark:text-amber-500"
                                            title={`${streak} day streak`}
                                        >
                                            {streak}🔥
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}

                        <th
                            scope="col"
                            className="px-3 py-2.5 text-right font-medium text-muted-foreground"
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-wider">
                                Progress
                            </span>
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
                                    'border-b border-neutral-100 transition-colors last:border-b-0 dark:border-neutral-800/70',
                                    isToday
                                        ? 'bg-primary/[0.04] dark:bg-primary/[0.07]'
                                        : 'hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30'
                                )}
                            >
                                <th
                                    scope="row"
                                    className={cn(
                                        'sticky left-0 z-10 px-3 py-1.5 text-left font-normal backdrop-blur',
                                        isToday
                                            ? 'bg-[#f7f8fd] dark:bg-[#15161c]'
                                            : 'bg-background'
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSelectDay?.(day)}
                                        className={cn(
                                            'flex items-baseline gap-2 rounded-md px-1 py-0.5 text-left transition-colors',
                                            'outline-none hover:bg-neutral-200/50 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-neutral-700/40',
                                            future && 'opacity-60'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'w-8 text-[13px]',
                                                isToday ? 'font-semibold text-foreground' : 'text-foreground'
                                            )}
                                        >
                                            {shortDayName(day)}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[12px] tabular-nums',
                                                isToday
                                                    ? 'font-semibold text-primary'
                                                    : 'text-muted-foreground'
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

                                <td className="px-3 py-1.5">
                                    <MiniBar percent={progress.percent} muted={progress.scheduled === 0} />
                                </td>
                            </tr>
                        )
                    })}
                </tbody>

                {/* Per-habit completion across the visible range */}
                <tfoot>
                    <tr className="border-t border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <th
                            scope="row"
                            className="sticky left-0 z-10 bg-neutral-50/70 px-3 py-2 text-left backdrop-blur dark:bg-neutral-900/40"
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Rate
                            </span>
                        </th>

                        {perHabit.map(({ habit, completion }) => (
                            <td key={habit.id} className="px-1 py-2 text-center">
                                <span
                                    className={cn(
                                        'text-[11px] font-semibold tabular-nums',
                                        completion.percent === 100
                                            ? 'text-emerald-600 dark:text-emerald-500'
                                            : completion.percent >= 50
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                    )}
                                    title={`${completion.done} of ${completion.scheduled} scheduled days`}
                                >
                                    {completion.scheduled === 0 ? '—' : `${completion.percent}%`}
                                </span>
                            </td>
                        ))}

                        <td className="px-3 py-2" />
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}
