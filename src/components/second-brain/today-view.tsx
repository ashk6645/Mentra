'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitIcon } from '@/lib/second-brain/icons'
import { SBCheckbox } from './checkbox'
import { SectionHeader, Metric, MetricRow, Ring, ProgressBar } from './primitives'
import { JournalPanel } from './journal-panel'
import { useSecondBrainData, useSecondBrainActions, useStoreReady } from '@/lib/second-brain/repo'
import { todayKey, longDateLabel, toDateKey, fromDateKey, weekDays, isFuture } from '@/lib/second-brain/date'
import {
    buildEntryIndex, lookupFrom, isScheduledOn, isWeeklyCount, weeklyTarget,
    habitStreak, dailyScore, isRoutineScheduledOn, routineProgress,
} from '@/lib/second-brain/domain/selectors'
import { TIME_OF_DAY_ORDER, TIME_OF_DAY_LABEL } from '@/lib/second-brain/domain/types'
import { R, T, INK, NUM, FOCUS, HOVER, LABEL } from '@/lib/second-brain/ui'

/**
 * The daily workspace.
 *
 * Deliberately more detailed than the Command Center, and navigable across days —
 * "I forgot to tick yesterday" is the most common real interaction, and a tracker
 * you cannot correct stops being trusted.
 */
export function TodayView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { replace, create, update } = useSecondBrainActions()

    const [date, setDate] = useState(() => todayKey())

    const today = todayKey()
    const isToday = date === today
    const week = useMemo(() => weekDays(fromDateKey(date)), [date])

    const isDone = useMemo(
        () => lookupFrom(buildEntryIndex(data.habitEntries)),
        [data.habitEntries]
    )

    const activeHabits = useMemo(
        () => data.habits.filter(h => h.archivedAt === null).sort((a, b) => a.sortOrder - b.sortOrder),
        [data.habits]
    )

    /** Grouped by time of day, so the page reads in the order the day happens. */
    const sections = useMemo(
        () =>
            TIME_OF_DAY_ORDER.map(slot => ({
                slot,
                habits: activeHabits.filter(
                    habit =>
                        habit.timeOfDay === slot &&
                        (isScheduledOn(habit, date) || isWeeklyCount(habit))
                ),
            })).filter(section => section.habits.length > 0),
        [activeHabits, date]
    )

    const routines = useMemo(
        () =>
            data.routines
                .filter(r => r.archivedAt === null && isRoutineScheduledOn(r, date))
                .map(routine => {
                    const steps = data.routineSteps
                        .filter(step => step.routineId === routine.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                    return { routine, steps, progress: routineProgress(steps, data.routineStepEntries, date) }
                }),
        [data.routines, data.routineSteps, data.routineStepEntries, date]
    )

    const score = useMemo(() => dailyScore(data, date), [data, date])

    const dueToday = useMemo(
        () => activeHabits.filter(h => isScheduledOn(h, date)),
        [activeHabits, date]
    )
    const doneToday = dueToday.filter(h => isDone(h.id, date)).length

    const toggleHabit = useCallback(
        (habitId: string) => {
            const exists = data.habitEntries.some(e => e.habitId === habitId && e.date === date)
            replace(
                'habitEntries',
                exists
                    ? data.habitEntries.filter(e => !(e.habitId === habitId && e.date === date))
                    : [...data.habitEntries, { habitId, date, completed: true, value: null }]
            )
        },
        [data.habitEntries, date, replace]
    )

    const toggleStep = useCallback(
        (stepId: string) => {
            const exists = data.routineStepEntries.some(e => e.stepId === stepId && e.date === date)
            replace(
                'routineStepEntries',
                exists
                    ? data.routineStepEntries.filter(e => !(e.stepId === stepId && e.date === date))
                    : [...data.routineStepEntries, { stepId, date, completedAt: new Date().toISOString() }]
            )
        },
        [data.routineStepEntries, date, replace]
    )

    const step = (delta: number) => {
        const next = fromDateKey(date)
        next.setDate(next.getDate() + delta)
        setDate(toDateKey(next))
    }

    if (!ready) {
        return (
            <div className="flex flex-col gap-6" aria-busy>
                <div className="h-9 w-64 animate-pulse rounded-[8px] bg-foreground/[0.05]" />
                <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                <div className="h-[320px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            {/*
              * Day navigation.
              *
              * Carries the date and nothing else. It previously repeated the page
              * title — "Today" as an h1 above, "Today" again here — and then
              * pinned the actual date to the opposite edge of a 1024px row, so
              * the screen opened with the same word twice and a void between
              * them. One line, one statement of where you are.
              */}
            <header className="flex flex-wrap items-center gap-1">
                <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous day"
                    className={cn('flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                        'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Not an h1 — the page header above already owns that. */}
                <span className={cn('px-2', T.button, INK.strong)}>
                    {longDateLabel(date)}
                </span>

                <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next day"
                    className={cn('flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                        'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {!isToday && (
                    <button
                        type="button"
                        onClick={() => setDate(today)}
                        className={cn('ml-1 px-2 py-1', R.sm, T.label, INK.muted,
                            'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                    >
                        Today
                    </button>
                )}
            </header>

            {isFuture(date) && (
                <p className={cn(T.label, INK.subtle)}>
                    Viewing an upcoming day.
                </p>
            )}

            <MetricRow>
                <Metric
                    value={score.value}
                    label={
                        score.components.length === 0
                            ? 'Nothing scheduled'
                            : score.components.map(c => `${c.label} ${c.done}/${c.total}`).join(' · ')
                    }
                    leading={<Ring percent={score.value} />}
                />
                <Metric
                    value={`${doneToday}/${dueToday.length}`}
                    label="Habits due"
                    animate={false}
                    leading={<Ring percent={dueToday.length === 0 ? 0 : (doneToday / dueToday.length) * 100} />}
                />
                <Metric
                    value={routines.reduce((sum, r) => sum + r.progress.done, 0)}
                    label={`of ${routines.reduce((sum, r) => sum + r.progress.expected, 0)} routine steps`}
                    leading={
                        <Ring
                            percent={(() => {
                                const total = routines.reduce((sum, r) => sum + r.progress.expected, 0)
                                const done = routines.reduce((sum, r) => sum + r.progress.done, 0)
                                return total === 0 ? 0 : (done / total) * 100
                            })()}
                        />
                    }
                />
            </MetricRow>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
                <div className="flex flex-col gap-8">
                    {/* Habits by time of day */}
                    {sections.length === 0 ? (
                        <p className={cn('px-2 py-6', T.body, INK.subtle)}>
                            Nothing scheduled for this day.
                        </p>
                    ) : (
                        sections.map(({ slot, habits }) => (
                            <section key={slot}>
                                <SectionHeader title={TIME_OF_DAY_LABEL[slot]} count={habits.length} />

                                <div className="flex flex-col">
                                    {habits.map(habit => {
                                        const done = isDone(habit.id, date)
                                        const streak = habitStreak(habit, isDone, today)
                                        const target = weeklyTarget(habit)
                                        const weekHits = target
                                            ? week.filter(d => d <= today && isDone(habit.id, d)).length
                                            : null

                                        return (
                                            <button
                                                key={habit.id}
                                                type="button"
                                                onClick={() => toggleHabit(habit.id)}
                                                aria-pressed={done}
                                                className={cn(
                                                    'flex items-center gap-3 px-2 py-2.5 text-left',
                                                    R.md, HOVER, FOCUS, 'transition-colors'
                                                )}
                                            >
                                                <SBCheckbox checked={done} />
                                                <HabitIcon
                                                    icon={habit.icon}
                                                    className={cn('h-[15px] w-[15px] shrink-0',
                                                        done ? 'text-muted-foreground/60' : 'text-foreground/60')}
                                                />

                                                <span className={cn('flex-1', T.body)}>
                                                    <span className={cn(done
                                                        ? 'text-muted-foreground line-through decoration-foreground/25'
                                                        : INK.strong)}>
                                                        {habit.name}
                                                    </span>
                                                    {habit.target !== null && (
                                                        <span className={cn('ml-1.5', INK.subtle)}>
                                                            {habit.target} {habit.unit}
                                                        </span>
                                                    )}
                                                </span>

                                                {weekHits !== null && (
                                                    <span className={cn('shrink-0 text-[11px]', NUM, INK.muted)}>
                                                        {weekHits}/{target} this week
                                                    </span>
                                                )}

                                                {streak > 0 && (
                                                    <span
                                                        className={cn('flex shrink-0 items-center gap-1 text-[11px] font-medium', NUM, INK.muted)}
                                                        title={`${streak} ${isWeeklyCount(habit) ? 'week' : 'day'} streak`}
                                                    >
                                                        <Flame className="h-3 w-3" strokeWidth={2} />
                                                        {streak}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>
                        ))
                    )}

                    {/* Routines */}
                    {routines.length > 0 && (
                        <section>
                            <SectionHeader title="Routines" />
                            {/* Wider than it was: with the card borders gone, this gap
                                is the only thing separating one routine from the next. */}
                            <div className="flex flex-col gap-7">
                                {routines.map(({ routine, steps, progress }) => (
                                    /*
                                     * A routine is a heading with its steps under it,
                                     * not a card. Once the rest of the screen stopped
                                     * being boxed this was the only bordered rectangle
                                     * left on the page, which made it read as the most
                                     * important thing there — it isn't more important
                                     * than the habits directly above it. The name and
                                     * progress bar do the grouping the border was doing.
                                     */
                                    <div key={routine.id} className="flex flex-col">
                                        <div className="flex items-center justify-between gap-3 py-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <HabitIcon icon={routine.icon} className="h-[15px] w-[15px] text-foreground/60" />
                                                <span className={cn(T.title, INK.strong)}>{routine.name}</span>
                                            </div>
                                            <span className={cn('text-[11px]', NUM, INK.muted)}>
                                                {progress.done}/{progress.expected}
                                            </span>
                                        </div>

                                        <ProgressBar percent={progress.percent} />

                                        <div className="flex flex-col pt-1.5">
                                            {steps.map(s => {
                                                const done = data.routineStepEntries.some(
                                                    e => e.stepId === s.id && e.date === date
                                                )
                                                return (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleStep(s.id)}
                                                        aria-pressed={done}
                                                        className={cn('flex items-center gap-3 px-2 py-2 text-left',
                                                            R.md, HOVER, FOCUS, 'transition-colors')}
                                                    >
                                                        <SBCheckbox checked={done} size="sm" />
                                                        <span className={cn('flex-1', T.body,
                                                            done ? 'text-muted-foreground line-through decoration-foreground/25' : INK.default)}>
                                                            {s.title}
                                                        </span>
                                                        {s.estimatedMinutes !== null && (
                                                            <span className={cn('text-[11px]', NUM, INK.subtle)}>
                                                                {s.estimatedMinutes}m
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Reflection */}
                <div className="flex flex-col gap-4">
                    <SectionHeader title="Reflection" />
                    <JournalPanel
                        key={date}
                        date={date}
                        entry={data.journalEntries.find(e => e.date === date) ?? null}
                        onCreate={create}
                        onUpdate={update}
                    />
                </div>
            </div>
        </div>
    )
}

export { LABEL }
