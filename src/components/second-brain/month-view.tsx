'use client'

import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitIcon } from '@/lib/second-brain/icons'
import { AnimatedNumber } from './animated-number'
import type { Habit } from '@/lib/second-brain/domain/types'
import { todayKey, weekdayOf, dayOfMonth } from '@/lib/second-brain/date'
import { isScheduledOn, habitCompletion, habitStreak } from '@/lib/second-brain/domain/selectors'
import { FOCUS, HAIRLINE, ICON, LABEL, NUM, SURFACE, intensityClass } from '@/lib/second-brain/ui'

interface MonthViewProps {
    days: string[]
    habits: Habit[]
    isDone: (habitId: string, date: string) => boolean
    onToggle: (habitId: string, date: string) => void
}

/**
 * Cell geometry, shared by the ruler and every row so day numbers stay aligned
 * with their squares. Sized so a 31-day month plus the label and rate columns fits
 * without horizontal scrolling — a heatmap you have to scroll defeats its purpose.
 */
const CELL = 14
const GAP = 3
const LABEL_W = 168
const RATE_W = 40

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
                const scheduled = isScheduledOn(habit, day)
                const done = isDone(habit.id, day)
                const isToday = day === today
                const future = day > today

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
                            'shrink-0 rounded-[4px] transition-all duration-200',
                            FOCUS,
                            intensityClass(done, scheduled),
                            scheduled && 'hover:scale-[1.25] hover:brightness-110',
                            !scheduled && 'cursor-default',
                            scheduled && !done && future && 'opacity-45',
                            isToday && 'ring-[1.5px] ring-primary ring-offset-[1.5px] ring-offset-background'
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
                completion: habitCompletion(habit, isDone, days),
                streak: habitStreak(habit, isDone),
            })),
        [habits, isDone, days]
    )

    if (habits.length === 0) return null

    return (
        <div className="flex flex-col gap-3">
            <div className={cn('overflow-x-auto rounded-[12px] px-5 py-5', SURFACE)}>
                <div className="flex min-w-max flex-col gap-3">
                    {/* Date ruler — without it 31 identical squares are unreadable. */}
                    <div className="flex items-end gap-3">
                        <div style={{ width: LABEL_W }} className="shrink-0" />
                        <div className="flex" style={{ gap: GAP }}>
                            {days.map(day => {
                                const n = dayOfMonth(day)
                                const isToday = day === today
                                const show = n === 1 || n % 5 === 0 || isToday

                                return (
                                    <span
                                        key={day}
                                        style={{ width: CELL }}
                                        className={cn(
                                            'shrink-0 text-center text-[10px] leading-none',
                                            NUM,
                                            isToday
                                                ? 'font-bold text-primary'
                                                : 'font-medium text-muted-foreground/60'
                                        )}
                                    >
                                        {show ? n : ''}
                                    </span>
                                )
                            })}
                        </div>
                        <div style={{ width: RATE_W }} className="shrink-0" />
                    </div>

                    {rows.map(({ habit, completion, streak }) => (
                        <div key={habit.id} className="flex items-center gap-3">
                            <div
                                style={{ width: LABEL_W }}
                                className="flex shrink-0 items-center gap-2"
                            >
                                <HabitIcon
                                    icon={habit.icon}
                                    className={cn(ICON.md, "shrink-0 text-foreground/60")}
                                />
                                <span
                                    className="flex-1 truncate text-[13px] text-foreground/85"
                                    title={habit.name}
                                >
                                    {habit.name}
                                </span>
                                {streak > 0 && (
                                    <span
                                        className={cn(
                                            'flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-muted-foreground',
                                            NUM
                                        )}
                                        title={`${streak} day streak`}
                                    >
                                        <Flame className={ICON.sm} strokeWidth={2} />
                                        {streak}
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
                                style={{ width: RATE_W }}
                                className={cn(
                                    'shrink-0 text-right text-[11px] font-semibold',
                                    NUM,
                                    completion.expected === 0
                                        ? 'text-muted-foreground/40'
                                        : completion.percent === 100
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-muted-foreground'
                                )}
                                title={`${completion.done} of ${completion.expected} scheduled days`}
                            >
                                {completion.expected === 0 ? (
                                    '—'
                                ) : (
                                    <AnimatedNumber value={completion.percent} suffix="%" />
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 px-1.5">
                {[
                    { cls: intensityClass(true, true), text: 'Done' },
                    { cls: intensityClass(false, true), text: 'Missed' },
                    { cls: intensityClass(false, false), text: 'Not scheduled' },
                ].map(({ cls, text }) => (
                    <span key={text} className="flex items-center gap-1.5">
                        <span className={cn('h-[10px] w-[10px] rounded-[4px]', cls)} />
                        <span className="text-[11px] text-muted-foreground">{text}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

export { HAIRLINE, LABEL, weekdayOf }
