'use client'

import { memo, useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/lib/second-brain/domain/types'
import { shortDayName, dayOfMonth, todayKey, isFuture } from '@/lib/second-brain/date'
import { isScheduledOn, habitCompletion, dayCompletion, habitStreak } from '@/lib/second-brain/domain/selectors'
import { HabitIcon } from '@/lib/second-brain/icons'
import { SBCheckbox } from './checkbox'
import { AnimatedNumber } from './animated-number'
import { BAR_SPRING, FOCUS, HAIRLINE, ICON, LABEL, NUM, SURFACE, SURFACE_SOLID } from '@/lib/second-brain/ui'

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
    row,
    col,
    onToggle,
}: {
    habitId: string
    date: string
    habitName: string
    scheduled: boolean
    done: boolean
    future: boolean
    row: number
    col: number
    onToggle: (habitId: string, date: string) => void
}) {
    if (!scheduled) {
        return (
            <td className="px-1 text-center align-middle">
                {/* A rest day is not a miss. A plain table has only checkboxes, so an
                    unscheduled Sunday reads identically to one you skipped. */}
                <span
                    className="inline-flex h-8 w-8 items-center justify-center"
                    title={`${habitName} isn't scheduled on this day`}
                >
                    <span className="h-[3px] w-[3px] rounded-full bg-foreground/20" />
                </span>
            </td>
        )
    }

    return (
        <td className="px-1 text-center align-middle">
            <button
                type="button"
                data-cell
                data-row={row}
                data-col={col}
                onClick={() => onToggle(habitId, date)}
                aria-label={`${habitName} on ${date}`}
                aria-pressed={done}
                className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-[8px]',
                    'transition-colors duration-200 hover:bg-foreground/[0.06]',
                    FOCUS,
                    future && !done && 'opacity-40'
                )}
            >
                <SBCheckbox checked={done} size="sm" />
            </button>
        </td>
    )
})

function RowProgress({ percent, dim }: { percent: number; dim: boolean }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <AnimatedNumber
                value={percent}
                suffix="%"
                className={cn(
                    'w-8 text-right text-[11px]',
                    NUM,
                    dim ? 'text-muted-foreground/50' : 'text-muted-foreground'
                )}
            />
            <div className="h-[3px] w-14 overflow-hidden rounded-full bg-foreground/[0.09]">
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
 * Two capabilities a generic database table can't express:
 *   1. "Not scheduled" is a dot, not an unchecked box, and is excluded from the
 *      completion denominator — so a weekday habit reads 100%, not 71%.
 *   2. A live streak sits in each column header, where it actually motivates.
 */
export function HabitGrid({ days, habits, isDone, onToggle, onSelectDay }: HabitGridProps) {
    const today = todayKey()
    const gridRef = useRef<HTMLTableElement>(null)

    const perHabit = useMemo(
        () =>
            habits.map(habit => ({
                habit,
                completion: habitCompletion(habit, isDone, days),
                streak: habitStreak(habit, isDone),
            })),
        [habits, isDone, days]
    )

    /**
     * Arrow-key navigation across the grid.
     *
     * 7 days x 5 habits is 35 tab stops; reaching the middle of the week by Tab alone
     * is not a real option. Arrows move by cell and step over unscheduled days (which
     * render as dots, not buttons); Space and Enter toggle via the button itself.
     */
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTableElement>) => {
        const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        if (!arrows.includes(event.key)) return

        const active = document.activeElement as HTMLElement | null
        if (!active?.dataset.cell) return

        event.preventDefault()
        // Also stop it bubbling: the view binds the same arrows to previous/next
        // period, so without this one press would move a cell *and* page the week.
        event.stopPropagation()

        const row = Number(active.dataset.row)
        const col = Number(active.dataset.col)
        const cells = Array.from(
            gridRef.current?.querySelectorAll<HTMLElement>('[data-cell]') ?? []
        )

        const dRow = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
        const dCol = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0

        // Keep stepping until a rendered cell turns up — gaps are unscheduled days.
        for (let step = 1; step <= 12; step++) {
            const targetRow = row + dRow * step
            const targetCol = col + dCol * step

            const next = cells.find(
                c => Number(c.dataset.row) === targetRow && Number(c.dataset.col) === targetCol
            )

            if (next) {
                next.focus()
                return
            }
        }
    }, [])

    if (habits.length === 0) return null

    return (
        <div className={cn('overflow-hidden rounded-[12px]', SURFACE)}>
            <div className="overflow-x-auto">
                <table ref={gridRef} onKeyDown={handleKeyDown} className="w-full border-collapse">
                    <thead>
                        <tr className={cn('border-b', HAIRLINE)}>
                            <th
                                scope="col"
                                className={cn(
                                    // Same token as the card, so the sticky column
                                    // composites to an identical colour — no seam.
                                    'sticky left-0 z-20 px-4 py-3 text-left',
                                    SURFACE_SOLID
                                )}
                            >
                                <span className={LABEL}>Day</span>
                            </th>

                            {perHabit.map(({ habit, streak }) => (
                                <th key={habit.id} scope="col" className="px-1.5 py-3">
                                    <div className="mx-auto flex w-[92px] flex-col items-center gap-2">
                                        <HabitIcon
                                            icon={habit.icon}
                                            className={cn(ICON.lg, "text-foreground/65")}
                                        />
                                        <span
                                            className="line-clamp-2 text-center text-[11px] font-medium leading-[1.3] text-foreground/80"
                                            title={habit.name}
                                        >
                                            {habit.name}
                                        </span>
                                        {/* Height is reserved whether or not there's a
                                            streak, so headers stay on one baseline. */}
                                        <span
                                            className={cn(
                                                'flex h-[13px] items-center gap-1 text-[11px] font-semibold leading-none',
                                                NUM,
                                                streak > 0 ? 'text-muted-foreground' : 'opacity-0'
                                            )}
                                            title={streak > 0 ? `${streak} day streak` : undefined}
                                        >
                                            <Flame className={ICON.sm} strokeWidth={2} />
                                            {streak > 0 ? streak : ''}
                                        </span>
                                    </div>
                                </th>
                            ))}

                            <th scope="col" className="px-4 py-3 text-right">
                                <span className={LABEL}>Progress</span>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {days.map((day, rowIndex) => {
                            const isToday = day === today
                            const future = isFuture(day)
                            const progress = dayCompletion(habits, isDone, day)

                            return (
                                <tr
                                    key={day}
                                    className={cn(
                                        'group border-b last:border-b-0 transition-colors',
                                        HAIRLINE,
                                        !isToday && 'hover:bg-foreground/[0.02]'
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
                                                'relative flex items-center gap-2 rounded-[8px] py-1.5 pl-2.5 pr-2 text-left transition-colors',
                                                'hover:bg-foreground/[0.05]',
                                                FOCUS,
                                                future && 'opacity-50'
                                            )}
                                        >
                                            {/* Today: a 2px rule, not a filled pill — quiet
                                                enough to leave completion the only strong colour. */}
                                            {isToday && (
                                                <span className="absolute -left-[9px] top-1/2 h-[15px] w-[2px] -translate-y-1/2 rounded-full bg-primary" />
                                            )}

                                            <span
                                                className={cn(
                                                    'w-8 text-[13px]',
                                                    isToday
                                                        ? 'font-semibold text-foreground'
                                                        : 'text-foreground/75'
                                                )}
                                            >
                                                {shortDayName(day)}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[13px]',
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

                                    {habits.map((habit, colIndex) => (
                                        <Cell
                                            key={habit.id}
                                            habitId={habit.id}
                                            date={day}
                                            habitName={habit.name}
                                            scheduled={isScheduledOn(habit, day)}
                                            done={isDone(habit.id, day)}
                                            future={future}
                                            row={rowIndex}
                                            col={colIndex}
                                            onToggle={onToggle}
                                        />
                                    ))}

                                    <td className="py-1 pl-3 pr-4">
                                        <RowProgress
                                            percent={progress.percent}
                                            dim={progress.expected === 0}
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
                                className={cn('sticky left-0 z-10 px-4 py-3 text-left', SURFACE_SOLID)}
                            >
                                <span className={LABEL}>Rate</span>
                            </th>

                            {perHabit.map(({ habit, completion }) => (
                                <td key={habit.id} className="px-1.5 py-3 text-center">
                                    {completion.expected === 0 ? (
                                        <span className="text-[11px] font-semibold text-muted-foreground/40">
                                            —
                                        </span>
                                    ) : (
                                        <AnimatedNumber
                                            value={completion.percent}
                                            suffix="%"
                                            className={cn(
                                                'text-[11px] font-semibold',
                                                NUM,
                                                completion.percent === 100
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground'
                                            )}
                                        />
                                    )}
                                </td>
                            ))}

                            <td className="px-4 py-3" />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}
