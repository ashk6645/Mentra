'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { shortDayName, dayOfMonth, todayKey, isFuture } from '@/lib/second-brain/date'
import { FOCUS, NUM, HAIRLINE, BAR_SPRING } from '@/lib/second-brain/ui'

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

/**
 * Monday-to-Sunday picker.
 *
 * Every day is selectable, including past ones — "I forgot to tick yesterday" is
 * the most common real interaction, and a tracker you can't correct stops being
 * trusted. Future days are reachable but de-emphasised.
 */
export const WeekStrip = memo(function WeekStrip({
    days,
    selectedDate,
    progressFor,
    onSelect,
}: WeekStripProps) {
    const today = todayKey()

    return (
        <div className="grid grid-cols-7 gap-1.5" role="tablist" aria-label="Days of the week">
            {days.map(day => {
                const isSelected = day === selectedDate
                const isToday = day === today
                const future = isFuture(day)
                const { done, total } = progressFor(day)
                const percent = total === 0 ? 0 : Math.round((done / total) * 100)
                const complete = total > 0 && done === total

                return (
                    <button
                        key={day}
                        role="tab"
                        aria-selected={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => onSelect(day)}
                        className={cn(
                            'group relative flex flex-col items-center gap-2 rounded-[12px] border px-1 py-3',
                            'transition-colors duration-200',
                            FOCUS,
                            isSelected
                                ? `bg-black/[0.035] dark:bg-white/[0.06] ${HAIRLINE}`
                                : 'border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
                            future && !isSelected && 'opacity-50'
                        )}
                    >
                        <span
                            className={cn(
                                'text-[11px] font-semibold uppercase tracking-[0.07em]',
                                isSelected ? 'text-foreground/70' : 'text-muted-foreground/70'
                            )}
                        >
                            {shortDayName(day)}
                        </span>

                        <span
                            className={cn(
                                'text-[15px] leading-none transition-colors',
                                NUM,
                                isToday
                                    ? 'font-bold text-primary'
                                    : isSelected
                                        ? 'font-semibold text-foreground'
                                        : 'font-medium text-muted-foreground group-hover:text-foreground'
                            )}
                        >
                            {dayOfMonth(day)}
                        </span>

                        <div className="h-[3px] w-full max-w-[34px] overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.09]">
                            <motion.div
                                className={cn(
                                    'h-full rounded-full',
                                    complete ? 'bg-emerald-500' : 'bg-foreground/55'
                                )}
                                initial={false}
                                animate={{ width: `${percent}%` }}
                                transition={BAR_SPRING}
                            />
                        </div>
                    </button>
                )
            })}
        </div>
    )
})
