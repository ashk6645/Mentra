'use client'

import { useMemo, useState } from 'react'
import { EmptyState } from './empty-state'
import Link from 'next/link'
import { ArrowRight, Flame, ListChecks, Plus, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitIcon } from '@/lib/second-brain/icons'
import { SBCheckbox } from './checkbox'
import { AddHabitDialog } from './add-habit-dialog'
import { IntroBanner } from './intro-banner'
import { PageHeader, SectionHeader, Metric, MetricRow, Ring, ProgressBar, StatusBadge, Divider } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady } from '@/lib/second-brain/repo'
import { todayKey, longDateLabel, weekDays } from '@/lib/second-brain/date'
import {
    buildEntryIndex, lookupFrom, isScheduledOn, isWeeklyCount, weeklyTarget,
    habitStreak, dailyScore, goalProgress, goalPace, isRoutineScheduledOn,
    routineProgress,
} from '@/lib/second-brain/domain/selectors'
import { FOCUS, HAIRLINE, HOVER, ICON, INK, META, NUM, R, ROW, T } from '@/lib/second-brain/ui'

/** Tasks and counts come from Mentra's database, not the local store. */
export interface ServerSnapshot {
    todayTaskCount: number
    overdueCount: number
    activeProjects: { id: string; name: string; color: string | null }[]
}

/** Time-of-day greeting. Computed client-side so it matches the reader's clock. */
function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 5) return 'Still up'
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

function CommandCenterSkeleton() {
    return (
        <div className="flex flex-col gap-8" aria-busy>
            <div className="flex flex-col gap-3">
                <div className="h-8 w-56 animate-pulse rounded-[8px] bg-foreground/[0.05]" />
                <div className="h-4 w-72 animate-pulse rounded-[6px] bg-foreground/[0.04]" />
            </div>
            <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="h-[280px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                <div className="h-[280px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        </div>
    )
}

export function CommandCenter({ server }: { server: ServerSnapshot }) {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, replace } = useSecondBrainActions()
    const [addHabitOpen, setAddHabitOpen] = useState(false)

    const today = todayKey()
    const week = useMemo(() => weekDays(new Date()), [])

    const isDone = useMemo(
        () => lookupFrom(buildEntryIndex(data.habitEntries)),
        [data.habitEntries]
    )

    const activeHabits = useMemo(
        () => data.habits.filter(h => h.archivedAt === null).sort((a, b) => a.sortOrder - b.sortOrder),
        [data.habits]
    )

    /** Due today, plus weekly-count habits that still owe sessions this week. */
    const todayHabits = useMemo(
        () =>
            activeHabits.filter(habit => {
                if (isScheduledOn(habit, today)) return true
                if (!isWeeklyCount(habit)) return false

                const hits = week.filter(day => day <= today && isDone(habit.id, day)).length
                return hits < (weeklyTarget(habit) ?? 0)
            }),
        [activeHabits, today, week, isDone]
    )

    const score = useMemo(() => dailyScore(data, today), [data, today])

    const routinesToday = useMemo(
        () =>
            data.routines
                .filter(r => r.archivedAt === null && isRoutineScheduledOn(r, today))
                .map(routine => {
                    const steps = data.routineSteps
                        .filter(step => step.routineId === routine.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                    return { routine, steps, progress: routineProgress(steps, data.routineStepEntries, today) }
                }),
        [data.routines, data.routineSteps, data.routineStepEntries, today]
    )

    const goals = useMemo(
        () =>
            data.goals
                .filter(g => g.archivedAt === null && (g.status === 'active' || g.status === 'at_risk'))
                .map(goal => ({
                    goal,
                    progress: goalProgress(goal, data.milestones),
                    pace: goalPace(goal, data.milestones, today),
                }))
                .sort((a, b) => Number(b.pace.behind) - Number(a.pace.behind)),
        [data.goals, data.milestones, today]
    )

    const toggleHabit = (habitId: string) => {
        const existing = data.habitEntries.find(e => e.habitId === habitId && e.date === today)

        replace(
            'habitEntries',
            existing
                ? data.habitEntries.filter(e => !(e.habitId === habitId && e.date === today))
                : [...data.habitEntries, { habitId, date: today, completed: true, value: null }]
        )
    }

    const toggleStep = (stepId: string) => {
        const existing = data.routineStepEntries.find(e => e.stepId === stepId && e.date === today)

        replace(
            'routineStepEntries',
            existing
                ? data.routineStepEntries.filter(e => !(e.stepId === stepId && e.date === today))
                : [...data.routineStepEntries, { stepId, date: today, completedAt: new Date().toISOString() }]
        )
    }

    const habitsDone = todayHabits.filter(h => isDone(h.id, today)).length

    if (!ready) return <CommandCenterSkeleton />

    return (
        <div className="flex flex-col gap-8">
            <IntroBanner />

            <PageHeader
                title={`${greeting()}.`}
                description={longDateLabel(today)}
                actions={
                    <Link
                        href="/today"
                        className={cn(
                            'flex items-center gap-1.5 border px-2.5 py-1.5',
                            R.md, T.button, INK.strong, HAIRLINE,
                            'transition-colors hover:bg-foreground/[0.04]', FOCUS
                        )}
                    >
                        Open Today
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                }
            />

            {/* Day at a glance */}
            <MetricRow>
                <Metric
                    value={score.value}
                    suffix=""
                    label={
                        score.components.length === 0
                            ? 'Nothing scheduled today'
                            : score.components.map(c => `${c.label} ${c.done}/${c.total}`).join(' · ')
                    }
                    leading={<Ring percent={score.value} />}
                />
                <Metric
                    value={`${habitsDone}/${todayHabits.length}`}
                    label="Habits today"
                    animate={false}
                    leading={
                        <Ring percent={todayHabits.length === 0 ? 0 : (habitsDone / todayHabits.length) * 100} />
                    }
                />
                <Metric
                    value={server.todayTaskCount}
                    label={
                        server.overdueCount > 0
                            ? `Tasks due today · ${server.overdueCount} overdue`
                            : 'Tasks due today'
                    }
                    leading={
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.06]')}>
                            <ListChecks className="h-4 w-4 text-foreground/70" strokeWidth={1.75} />
                        </span>
                    }
                />
            </MetricRow>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="flex flex-col gap-8">
                    {/* Habits */}
                    <section>
                        <SectionHeader
                            title="Habits"
                            count={todayHabits.length}
                            action={
                                <button
                                    type="button"
                                    onClick={() => setAddHabitOpen(true)}
                                    className={cn(
                                        'flex items-center gap-1 px-1.5 py-1', R.sm, T.label, INK.muted,
                                        'transition-colors hover:text-foreground', FOCUS
                                    )}
                                >
                                    <Plus className="h-3 w-3" />
                                    New
                                </button>
                            }
                        />

                        {todayHabits.length === 0 ? (
                            <EmptyState title="Nothing due today" />
                        ) : (
                            <div className="flex flex-col">
                                {todayHabits.map(habit => {
                                    const done = isDone(habit.id, today)
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
                                                ROW, FOCUS, 'text-left'
                                            )}
                                        >
                                            <SBCheckbox checked={done} />
                                            <HabitIcon
                                                icon={habit.icon}
                                                className={cn(ICON.md, 'shrink-0', done ? 'text-muted-foreground/60' : 'text-foreground/60')}
                                            />
                                            <span className={cn('flex-1', T.body)}>
                                                {/* Only the name is struck through. Striking the
                                                    target too made "3 litres" read as cancelled
                                                    rather than achieved. */}
                                                <span
                                                    className={cn(
                                                        done
                                                            ? 'text-muted-foreground line-through decoration-foreground/25'
                                                            : INK.strong
                                                    )}
                                                >
                                                    {habit.name}
                                                </span>
                                                {habit.target !== null && (
                                                    <span className={cn('ml-1.5 no-underline', INK.subtle)}>
                                                        {habit.target} {habit.unit}
                                                    </span>
                                                )}
                                            </span>

                                            {/*
                                              * Both columns are always rendered, even when empty.
                                              * Conditionally omitting them let each row end wherever
                                              * its own content happened to end, so the figures down
                                              * the side of the list never lined up. Fixed widths only
                                              * rule up if the column is always there.
                                              */}
                                            <span className={cn(META.wide, 'text-[11px]', NUM, INK.muted)}>
                                                {weekHits !== null && `${weekHits}/${target} this week`}
                                            </span>

                                            <span
                                                className={cn(META.narrow, 'text-[11px] font-medium', NUM, INK.muted)}
                                                title={streak > 0 ? `${streak} ${isWeeklyCount(habit) ? 'week' : 'day'} streak` : undefined}
                                            >
                                                {streak > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Flame className={ICON.sm} strokeWidth={2} />
                                                        {streak}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {/* Routines */}
                    {routinesToday.length > 0 && (
                        <section>
                            <SectionHeader title="Routines" />
                            {/* Wider than it was: with the card borders gone, this gap
                                is the only thing separating one routine from the next. */}
                            <div className="flex flex-col gap-8">
                                {routinesToday.map(({ routine, steps, progress }) => (
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
                                            <div className="flex items-center gap-3">
                                                <HabitIcon icon={routine.icon} className={cn(ICON.md, "text-foreground/60")} />
                                                <span className={cn(T.title, INK.strong)}>{routine.name}</span>
                                            </div>
                                            <span className={cn('text-[11px]', NUM, INK.muted)}>
                                                {progress.done}/{progress.expected}
                                            </span>
                                        </div>

                                        <ProgressBar percent={progress.percent} />

                                        <div className="flex flex-col pt-1.5">
                                            {steps.map(step => {
                                                const done = data.routineStepEntries.some(
                                                    e => e.stepId === step.id && e.date === today
                                                )
                                                return (
                                                    <button
                                                        key={step.id}
                                                        type="button"
                                                        onClick={() => toggleStep(step.id)}
                                                        aria-pressed={done}
                                                        className={cn(
                                                            ROW, FOCUS, 'text-left'
                                                        )}
                                                    >
                                                        <SBCheckbox checked={done} size="sm" />
                                                        <span
                                                            className={cn(
                                                                'flex-1', T.body,
                                                                done ? 'text-muted-foreground line-through decoration-foreground/25' : INK.default
                                                            )}
                                                        >
                                                            {step.title}
                                                        </span>
                                                        {step.estimatedMinutes !== null && (
                                                            <span className={cn('text-[11px]', NUM, INK.subtle)}>
                                                                {step.estimatedMinutes}m
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

                {/* Right column */}
                <div className="flex flex-col gap-8">
                    {/* Goals */}
                    <section>
                        <SectionHeader title="Goals" count={goals.length} />

                        {goals.length === 0 ? (
                            <p className={cn('px-2 py-6', T.body, INK.subtle)}>No active goals.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {goals.map(({ goal, progress, pace }) => (
                                    <div key={goal.id} className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className={cn('flex-1', T.body, INK.strong)}>{goal.title}</span>
                                            {pace.behind && (
                                                <StatusBadge tone="warning">
                                                    <TrendingDown className="h-2.5 w-2.5" />
                                                    Behind
                                                </StatusBadge>
                                            )}
                                        </div>

                                        <ProgressBar percent={progress} />

                                        <div className={cn('flex items-center justify-between text-[11px]', NUM, INK.muted)}>
                                            <span>
                                                {goal.target !== null
                                                    ? `${goal.current} of ${goal.target} ${goal.metric}`
                                                    : `${progress}% of milestones`}
                                            </span>
                                            <span>{pace.elapsed}% of time gone</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <Divider />

                    {/* Projects — from Mentra's database, not this store */}
                    <section>
                        <SectionHeader title="Projects" count={server.activeProjects.length} />

                        {server.activeProjects.length === 0 ? (
                            <p className={cn('px-2 py-6', T.body, INK.subtle)}>No projects yet.</p>
                        ) : (
                            <div className="flex flex-col">
                                {server.activeProjects.slice(0, 6).map(project => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className={cn(
                                            ROW, FOCUS
                                        )}
                                    >
                                        <span
                                            aria-hidden
                                            className="h-2 w-2 shrink-0 rounded-full"
                                            style={{ background: project.color ?? 'currentColor' }}
                                        />
                                        <span className={cn('flex-1 truncate', T.body, INK.default)}>
                                            {project.name}
                                        </span>
                                        <ArrowRight className={cn('h-3.5 w-3.5 shrink-0', INK.subtle)} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <AddHabitDialog
                open={addHabitOpen}
                onOpenChange={setAddHabitOpen}
                onAdd={input => {
                    create('habits', {
                        id: `habit_${crypto.randomUUID()}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        archivedAt: null,
                        name: input.name,
                        icon: input.icon,
                        areaId: null,
                        frequency:
                            input.scheduleDays.length === 0
                                ? { kind: 'daily' }
                                : { kind: 'weekdays', days: input.scheduleDays },
                        timeOfDay: input.timeOfDay,
                        target: null,
                        unit: null,
                        sortOrder: data.habits.length,
                    })
                }}
            />
        </div>
    )
}
