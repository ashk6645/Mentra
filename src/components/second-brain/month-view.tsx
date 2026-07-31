'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/lib/second-brain/types'
import { todayKey, weekdayOf, dayOfMonth } from '@/lib/second-brain/date'
import { isScheduled, completionFor, currentStreak } from '@/lib/second-brain/stats'

interface MonthViewProps {
    days: string[]
    habits: Habit[]
    isDone: (habitId: string, date: string) => boolean
    onToggle: (habitId: string, date: string) => void
}

/**
 * Cell geometry, shared by the header ruler and every habit row so the day
 * numbers stay aligned with their squares. Sized so a full 31-day month plus the
 * label and rate columns fits without horizontal scrolling at typical widths —
 * a heatmap you have to scroll defeats the point of seeing the month at once.
 */
const CELL = 14
const GAP = 2

/** Squares for one habit across the month. */
function HabitRow({
    habit,
    days,
    isDone,
    onToggle,
    today,
}: {
    habit: Habit
    days: string[]
    isDone: (habitId: string, date: string) => boolean
    onToggle: (habitId: string, date: string) => void
    today: string
}) {
    return (
        <div className="flex" style={{ gap: GAP }}>
            {days.map(day => {
                const scheduled = isScheduled(habit, day)
                const done = isDone(habit.id, day)
                const isToday = day === today
                const future = day > today
                const weekend = weekdayOf(day) === 0 || weekdayOf(day) === 6

                return (
                    <button
                        key={day}
                        type="button"
                        disabled={!scheduled}
                        onClick={() => onToggle(habit.id, day)}
                        aria-label={`${habit.name} on ${day}`}
                        aria-pressed={scheduled ? done : undefined}
                        title={`${habit.name} · ${day}${scheduled ? (done ? ' · done' : '') : ' · not scheduled'}`}
                        style={{ width: CELL, height: CELL }}
                        className={cn(
                            'shrink-0 rounded-[4px] transition-all duration-150',
                            'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            !scheduled && 'cursor-default bg-neutral-100 dark:bg-neutral-800/40',
                            scheduled && done && 'bg-emerald-500 hover:bg-emerald-600',
                            scheduled && !done && !weekend && 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700/70 dark:hover:bg-neutral-600',
                            // Weekends a shade softer, so the weekly rhythm is readable
                            // without needing gridlines.
                            scheduled && !done && weekend && 'bg-neutral-200/60 hover:bg-neutral-300 dark:bg-neutral-700/40 dark:hover:bg-neutral-600',
                            scheduled && !done && future && 'opacity-50',
                            isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                        )}
                    />
                )
            })}
        </div>
    )
}

export function MonthView({ days, habits, isDone, onToggle }: MonthViewProps) {
    const today = todayKey()

    const rows = useMemo(
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
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex min-w-max flex-col gap-2.5">
                    {/* Date ruler — without it the squares are an unreadable stripe. */}
                    <div className="flex items-end gap-3">
                        <div className="w-[168px] shrink-0" />
                        <div className="flex" style={{ gap: GAP }}>
                            {days.map(day => {
                                const n = dayOfMonth(day)
                                const show = n === 1 || n % 5 === 0
                                return (
                                    <span
                                        key={day}
                                        style={{ width: CELL }}
                                        className={cn(
                                            'shrink-0 text-center text-[9px] tabular-nums leading-none',
                                            day === today
                                                ? 'font-semibold text-primary'
                                                : 'text-muted-foreground/70'
                                        )}
                                    >
                                        {show || day === today ? n : ''}
                                    </span>
                                )
                            })}
                        </div>
                        <div className="w-[38px] shrink-0" />
                    </div>

                    {rows.map(({ habit, completion, streak }) => (
                        <div key={habit.id} className="flex items-center gap-3">
                            <div className="flex w-[168px] shrink-0 items-center gap-2">
                                <span aria-hidden className="shrink-0 text-sm leading-none">
                                    {habit.icon}
                                </span>
                                <span className="flex-1 truncate text-[13px] text-foreground" title={habit.name}>
                                    {habit.name}
                                </span>
                                {streak > 0 && (
                                    <span
                                        className="shrink-0 text-[10px] font-semibold tabular-nums text-amber-600 dark:text-amber-500"
                                        title={`${streak} day streak`}
                                    >
                                        {streak}🔥
                                    </span>
                                )}
                            </div>

                            <HabitRow
                                habit={habit}
                                days={days}
                                isDone={isDone}
                                onToggle={onToggle}
                                today={today}
                            />

                            <span
                                className={cn(
                                    'w-[38px] shrink-0 text-right text-[12px] font-semibold tabular-nums',
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
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="h-[11px] w-[11px] rounded-[3px] bg-emerald-500" />
                    Done
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-[11px] w-[11px] rounded-[3px] bg-neutral-200 dark:bg-neutral-700/70" />
                    Missed
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-[11px] w-[11px] rounded-[3px] bg-neutral-100 dark:bg-neutral-800/40" />
                    Not scheduled
                </span>
            </div>
        </div>
    )
}
