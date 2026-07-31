'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { shortDayName, dayOfMonth, todayKey, isFuture } from '@/lib/second-brain/date'

interface DayProgress {
    done: number
    total: number
}

interface WeekStripProps {
    days: string[]
    selectedDate: string
    progressFor: (date: string) => DayProgress
    onSelect: (date: string) => void
}

/** Thin completion bar under each day. Neutral when nothing is scheduled. */
const ProgressBar = memo(function ProgressBar({ done, total }: DayProgress) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    const complete = total > 0 && done === total

    return (
        <div className="h-1 w-full rounded-full bg-neutral-200/70 dark:bg-neutral-700/50 overflow-hidden">
            <div
                className={cn(
                    'h-full rounded-full transition-all duration-300 ease-out',
                    complete ? 'bg-emerald-500' : 'bg-primary'
                )}
                style={{ width: `${pct}%` }}
            />
        </div>
    )
})

/**
 * Monday-to-Sunday day picker.
 *
 * Every day is selectable, including past ones — the most common real interaction is
 * "I forgot to tick yesterday", and a tracker you cannot correct stops being trusted.
 * Future days are reachable too, so the week can be previewed, but they are visually
 * de-emphasised.
 */
export const WeekStrip = memo(function WeekStrip({
    days,
    selectedDate,
    progressFor,
    onSelect,
}: WeekStripProps) {
    const today = todayKey()

    return (
        <div
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
            role="tablist"
            aria-label="Days of the week"
        >
            {days.map(day => {
                const isSelected = day === selectedDate
                const isToday = day === today
                const future = isFuture(day)
                const progress = progressFor(day)

                return (
                    <button
                        key={day}
                        role="tab"
                        aria-selected={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => onSelect(day)}
                        className={cn(
                            'group flex flex-col items-center gap-2 rounded-xl border px-1 py-2.5 sm:px-2 sm:py-3',
                            'transition-colors duration-150 outline-none',
                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            isSelected
                                ? 'border-foreground/20 bg-neutral-100 dark:bg-neutral-800/70'
                                : 'border-transparent hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40',
                            future && !isSelected && 'opacity-55'
                        )}
                    >
                        <span
                            className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider',
                                isSelected ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            {shortDayName(day)}
                        </span>

                        <span
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors',
                                isToday && 'bg-primary text-primary-foreground font-semibold',
                                !isToday && isSelected && 'font-semibold text-foreground',
                                !isToday && !isSelected && 'text-muted-foreground group-hover:text-foreground'
                            )}
                        >
                            {dayOfMonth(day)}
                        </span>

                        <div className="w-full px-0.5">
                            <ProgressBar {...progress} />
                        </div>
                    </button>
                )
            })}
        </div>
    )
})
