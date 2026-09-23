'use client'

import { memo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check, Flame, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ItemIcon } from '@/lib/second-brain/icons'
import { AnimatedNumber } from './animated-number'
import { toggleHabit } from '@/lib/second-brain/actions'
import { dayOfMonth, longDateLabel, shortDayName } from '@/lib/second-brain/date'
import {
    frequencyLabel, habitCompletion, habitStreak, isLoggableOn, isWeeklyCount, trackingStart, weekHits, weeklyTarget,
    type DoneLookup,
} from '@/lib/second-brain/domain/selectors'
import { TIME_OF_DAY_LABEL, type Habit } from '@/lib/second-brain/domain/types'
import { DONE, FOCUS, HAIRLINE, HOVER, ICON, INK, NUM, POP, T, TRANSITION } from '@/lib/second-brain/ui'

type Variant = 'week' | 'month'

/**
 * Habits as rows, days as columns — one component for both Week and Month.
 *
 * Rows rather than columns per habit because the day axis is the fixed one:
 * seven days or a month, however many habits there are. Two things a generic
 * table can't say, and this one does:
 *
 * 1. A day a habit isn't scheduled is a dot, not an empty box. A rest day is
 *    not a miss, and it's excluded from the rate.
 * 2. The future can be seen but not ticked. Logging tomorrow is never right.
 */

// ─── Cells ───────────────────────────────────────────────────────────────────

interface CellProps {
    habit: Habit
    date: string
    done: boolean
    loggable: boolean
    future: boolean
    /** Before the habit existed: shown faintly, not as a miss, but still tickable. */
    before: boolean
    today: boolean
    row: number
    col: number
}

const WeekCell = memo(function WeekCell({ habit, date, done, loggable, future, before, today, row, col }: CellProps) {
    if (!loggable) {
        return (
            <span className="flex h-8 w-8 items-center justify-center" title={`Not scheduled · ${longDateLabel(date)}`}>
                <span className="h-[3px] w-[3px] rounded-full bg-foreground/20" />
            </span>
        )
    }

    return (
        <button
            type="button"
            data-cell
            data-row={row}
            data-col={col}
            disabled={future}
            onClick={() => toggleHabit(habit.id, date)}
            aria-pressed={done}
            aria-label={`${habit.name}, ${longDateLabel(date)}`}
            className={cn(
                'group/cell relative flex h-8 w-8 items-center justify-center rounded-[8px]', FOCUS,
                'disabled:cursor-default'
            )}
        >
            <motion.span
                initial={false}
                animate={{ scale: done ? [1, 1.12, 1] : 1 }}
                transition={POP}
                className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-[7px] border',
                    'transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    done
                        ? cn('border-transparent', DONE.fill)
                        : future || before
                            ? cn(
                                'border-dashed border-black/[0.1] dark:border-white/[0.1]',
                                !future && 'group-hover/cell:border-black/[0.3] dark:group-hover/cell:border-white/[0.3]'
                            )
                            : cn(
                                today ? 'border-black/[0.28] dark:border-white/[0.3]' : 'border-black/[0.13] dark:border-white/[0.14]',
                                'group-hover/cell:border-black/[0.4] group-hover/cell:bg-black/[0.03] dark:group-hover/cell:border-white/[0.4] dark:group-hover/cell:bg-white/[0.04]'
                            )
                )}
            >
                <motion.span
                    initial={false}
                    animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.6 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </motion.span>
            </motion.span>
        </button>
    )
})

const MonthCell = memo(function MonthCell({ habit, date, done, loggable, future, before, today, row, col }: CellProps) {
    const label = `${habit.name}, ${longDateLabel(date)}${done ? ' — done' : loggable ? '' : ' — not scheduled'}`

    return (
        <button
            type="button"
            data-cell
            data-row={row}
            data-col={col}
            disabled={future || !loggable}
            onClick={() => toggleHabit(habit.id, date)}
            aria-pressed={loggable ? done : undefined}
            aria-label={label}
            title={label}
            className={cn(
                'h-4 w-4 shrink-0 rounded-[4px]', TRANSITION.fast, FOCUS,
                'enabled:hover:scale-[1.18] disabled:cursor-default',
                done
                    ? DONE.fill
                    : loggable && !future && !before
                        ? 'bg-black/[0.09] enabled:hover:bg-black/[0.16] dark:bg-white/[0.1] dark:enabled:hover:bg-white/[0.18]'
                        : 'bg-black/[0.03] enabled:hover:bg-black/[0.1] dark:bg-white/[0.035] dark:enabled:hover:bg-white/[0.12]',
                today && 'ring-[1.5px] ring-foreground/70 ring-offset-2 ring-offset-card'
            )}
        />
    )
})

// ─── Table ───────────────────────────────────────────────────────────────────

function Meta({ habit, isDone, today }: { habit: Habit; isDone: DoneLookup; today: string }) {
    if (isWeeklyCount(habit)) {
        const hits = weekHits(habit, isDone, today)
        const target = weeklyTarget(habit)!
        return (
            <span className={cn(NUM, hits >= target && DONE.text)}>
                {Math.min(hits, target)} of {target} this week
            </span>
        )
    }
    return <>{frequencyLabel(habit)} · {TIME_OF_DAY_LABEL[habit.timeOfDay]}</>
}

export function HabitTable({
    variant,
    days,
    habits,
    isDone,
    today,
    onEdit,
    onCreate,
}: {
    variant: Variant
    days: string[]
    habits: Habit[]
    isDone: DoneLookup
    today: string
    onEdit: (habit: Habit) => void
    onCreate: () => void
}) {
    const tableRef = useRef<HTMLTableElement>(null)

    /**
     * Arrow keys move between cells; Space and Enter toggle via the button.
     *
     * Five habits across a week is thirty-five tab stops, and reaching the middle
     * by Tab alone isn't a real option. Movement steps over dots and the future.
     */
    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLTableElement>) => {
        const deltas: Record<string, [number, number]> = {
            ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
        }
        const delta = deltas[event.key]
        const active = document.activeElement as HTMLElement | null
        if (!delta || !active?.dataset.cell) return

        event.preventDefault()
        event.stopPropagation()

        const row = Number(active.dataset.row)
        const col = Number(active.dataset.col)
        const cells = Array.from(tableRef.current?.querySelectorAll<HTMLButtonElement>('[data-cell]:not(:disabled)') ?? [])

        for (let step = 1; step <= 31; step++) {
            const next = cells.find(
                c => Number(c.dataset.row) === row + delta[0] * step && Number(c.dataset.col) === col + delta[1] * step
            )
            if (next) {
                next.focus()
                return
            }
        }
    }, [])

    const week = variant === 'week'

    const cellProps = (habit: Habit, start: string, day: string, row: number, col: number): CellProps => ({
        habit,
        date: day,
        done: isDone(habit.id, day),
        loggable: isLoggableOn(habit, day),
        future: day > today,
        before: day < start,
        today: day === today,
        row,
        col,
    })

    return (
        <div className="overflow-x-auto">
            <table ref={tableRef} onKeyDown={onKeyDown} data-arrow-nav className="w-full border-collapse">
                <thead>
                    <tr className={cn('border-b', HAIRLINE)}>
                        <th scope="col" className="sticky left-0 z-10 bg-card py-2.5 pl-3 pr-2 text-left sm:pl-4 sm:pr-3">
                            <span className={cn(T.caption, INK.subtle)}>Habit</span>
                        </th>

                        {days.map(day => {
                            const isToday = day === today
                            return (
                                <th key={day} scope="col" className={cn('p-0', week ? 'w-8 sm:w-11' : 'w-5')}>
                                    {week ? (
                                        <div className="flex flex-col items-center gap-1 py-2">
                                            <span className={cn(T.caption, 'text-[10.5px] uppercase tracking-[0.04em]', isToday ? INK.strong : INK.subtle)}>
                                                {shortDayName(day)}
                                            </span>
                                            <span
                                                className={cn(
                                                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[12px] font-medium', NUM,
                                                    isToday ? 'bg-foreground text-background' : INK.muted
                                                )}
                                            >
                                                {dayOfMonth(day)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span
                                            className={cn(
                                                'block py-2.5 text-center text-[10px] font-medium', NUM,
                                                isToday ? INK.strong : INK.subtle
                                            )}
                                        >
                                            {dayOfMonth(day)}
                                        </span>
                                    )}
                                </th>
                            )
                        })}

                        <th scope="col" className="hidden w-16 py-2.5 pr-2 text-right sm:table-cell">
                            <span className={cn(T.caption, INK.subtle)}>Streak</span>
                        </th>
                        <th scope="col" className="hidden w-16 py-2.5 pr-4 text-right sm:table-cell">
                            <span className={cn(T.caption, INK.subtle)}>Rate</span>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {habits.map((habit, rowIndex) => {
                        const streak = habitStreak(habit, isDone, today)
                        const rate = habitCompletion(habit, isDone, days, today)
                        const start = trackingStart(habit)

                        return (
                            <tr key={habit.id} className={cn('group border-b', HAIRLINE)}>
                                <th scope="row" className="sticky left-0 z-10 bg-card p-0 text-left font-normal">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(habit)}
                                        className={cn(
                                            'flex w-full min-w-[104px] max-w-[108px] items-center gap-3 py-2.5 pl-3 pr-2 text-left sm:min-w-[220px] sm:max-w-none sm:pl-4 sm:pr-3',
                                            HOVER, TRANSITION.fast, FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
                                        )}
                                        title="Edit habit"
                                    >
                                        {/* The icon tile gives way on a phone, where the week needs the room. */}
                                        <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-black/[0.04] sm:flex dark:bg-white/[0.06]">
                                            <ItemIcon icon={habit.icon} className={cn(ICON.md, INK.default)} />
                                        </span>
                                        <span className="flex min-w-0 flex-col">
                                            <span className={cn(T.body, 'truncate font-medium', INK.strong)}>{habit.name}</span>
                                            <span className={cn(T.meta, 'truncate', INK.subtle)}>
                                                <Meta habit={habit} isDone={isDone} today={today} />
                                            </span>
                                        </span>
                                    </button>
                                </th>

                                {days.map((day, colIndex) => (
                                    <td
                                        key={day}
                                        className={cn(
                                            'p-0 text-center align-middle',
                                            week && day === today && 'bg-black/[0.018] dark:bg-white/[0.025]'
                                        )}
                                    >
                                        <div className="flex items-center justify-center">
                                            {week ? (
                                                <WeekCell {...cellProps(habit, start, day, rowIndex, colIndex)} />
                                            ) : (
                                                <MonthCell {...cellProps(habit, start, day, rowIndex, colIndex)} />
                                            )}
                                        </div>
                                    </td>
                                ))}

                                <td className="hidden pr-2 text-right sm:table-cell">
                                    <span
                                        className={cn('inline-flex items-center gap-1', T.meta, 'font-medium', NUM, streak > 0 ? INK.default : INK.subtle)}
                                        title={streak > 0 ? `${streak} ${isWeeklyCount(habit) ? 'week' : 'day'} streak` : 'No streak yet'}
                                    >
                                        <Flame className={cn(ICON.sm, streak === 0 && 'opacity-40')} strokeWidth={2.25} />
                                        {streak}
                                    </span>
                                </td>
                                <td className="hidden pr-4 text-right sm:table-cell">
                                    <span className={cn(T.meta, 'font-medium', NUM, rate.expected === 0 ? INK.subtle : rate.percent === 100 ? DONE.text : INK.default)}>
                                        {rate.expected === 0 ? '—' : <AnimatedNumber value={rate.percent} suffix="%" />}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <button
                type="button"
                onClick={onCreate}
                className={cn('flex h-11 w-full items-center gap-3 pl-4 text-left', T.body, INK.subtle, HOVER, TRANSITION.fast, 'hover:text-foreground', FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0')}
            >
                <span className="flex h-7 w-7 items-center justify-center">
                    <Plus className={ICON.md} strokeWidth={2} />
                </span>
                New habit
            </button>
        </div>
    )
}
