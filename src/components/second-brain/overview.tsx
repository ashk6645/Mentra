'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronRight, Flame, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from './checkbox'
import { IntroBanner } from './intro-banner'
import { HabitDialog } from './habit-dialog'
import { StepRow } from './routine-card'
import { GoalRow } from './goal-row'
import { Button, Card, CardHeader, EmptyState, PageHeader, Reveal, Ring, Stat, StatGrid, Strike } from './primitives'
import { ItemIcon } from '@/lib/second-brain/icons'
import { toggleHabit } from '@/lib/second-brain/actions'
import { useSecondBrainData, useStoreReady } from '@/lib/second-brain/repo'
import { longDateLabel, todayKey } from '@/lib/second-brain/date'
import {
    buildEntryIndex, dailyScore, goalPace, habitStreak, isDueToday, isRoutineScheduledOn,
    isWeeklyCount, lookupFrom, routineProgress, sortByTimeOfDay, weekHits, weeklyTarget,
} from '@/lib/second-brain/domain/selectors'
import { TIME_OF_DAY_LABEL, TIME_OF_DAY_ORDER } from '@/lib/second-brain/domain/types'
import { BEHIND, DIVIDE, DONE, FOCUS, HAIRLINE, HOVER, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

/** Tasks come from Mentra's database, not the local store. */
export interface ServerSnapshot {
    todayTaskCount: number
    overdueCount: number
}

/** Computed on the client so it matches the reader's clock, not the server's. */
function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 5) return 'Good evening'
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

function ViewAll({ href }: { href: string }) {
    return (
        <Link
            href={href}
            className={cn('-mr-1.5 flex h-7 items-center gap-0.5 px-1.5', R.md, T.meta, INK.muted, TRANSITION.fast, 'hover:text-foreground', FOCUS)}
        >
            View all
            <ChevronRight className={ICON.sm} strokeWidth={2.25} />
        </Link>
    )
}

/** The link out to Mentra's own task list, carrying today's real counts. */
function TasksLink({ server }: { server: ServerSnapshot }) {
    const count = server.todayTaskCount

    return (
        <Link
            href="/today"
            className={cn(
                'inline-flex h-8 items-center gap-2 border bg-card px-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]', R.md, HAIRLINE,
                T.button, INK.strong, TRANSITION.fast, 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]', FOCUS
            )}
        >
            <span className={NUM}>{count === 0 ? 'No tasks today' : `${count} ${count === 1 ? 'task' : 'tasks'} today`}</span>
            {server.overdueCount > 0 && (
                <span className={cn('flex items-center gap-1.5', T.meta, NUM, BEHIND.text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', BEHIND.dot)} aria-hidden />
                    {server.overdueCount} overdue
                </span>
            )}
            <ArrowUpRight className={cn(ICON.md, INK.subtle)} strokeWidth={2} />
        </Link>
    )
}

/**
 * The overview: today, at a glance.
 *
 * One question per card — what's left to do today, which routine is next, and
 * whether any goal is slipping — plus the day's real task count from Mentra
 * itself. Everything is tickable in place; the other pages are for going deeper.
 */
export function Overview({ server }: { server: ServerSnapshot }) {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const router = useRouter()
    const [dialog, setDialog] = useState({ open: false, key: 'new' })

    const today = todayKey()
    const isDone = useMemo(() => lookupFrom(buildEntryIndex(data.habitEntries)), [data.habitEntries])

    const habits = useMemo(
        () => sortByTimeOfDay(data.habits).filter(h => isDueToday(h, isDone, today)),
        [data.habits, isDone, today]
    )
    const groups = TIME_OF_DAY_ORDER
        .map(slot => ({ slot, habits: habits.filter(h => h.timeOfDay === slot) }))
        .filter(group => group.habits.length > 0)
    const habitsDone = habits.filter(h => isDone(h.id, today)).length

    const routines = useMemo(
        () =>
            sortByTimeOfDay(data.routines.filter(r => isRoutineScheduledOn(r, today)))
                .map(routine => {
                    const steps = data.routineSteps
                        .filter(s => s.routineId === routine.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                    return { routine, steps, progress: routineProgress(steps, data.routineStepEntries, today) }
                })
                .filter(r => r.steps.length > 0),
        [data.routines, data.routineSteps, data.routineStepEntries, today]
    )
    const stepsDone = routines.reduce((sum, r) => sum + r.progress.done, 0)
    const stepsTotal = routines.reduce((sum, r) => sum + r.progress.expected, 0)
    const doneSteps = new Set(data.routineStepEntries.filter(e => e.date === today).map(e => e.stepId))

    const goals = useMemo(
        () =>
            data.goals
                .filter(g => g.status !== 'achieved')
                .map(goal => ({ goal, pace: goalPace(goal, data.milestones, today) }))
                .sort((a, b) =>
                    Number(b.pace.behind) - Number(a.pace.behind) ||
                    Number(a.goal.status === 'paused') - Number(b.goal.status === 'paused') ||
                    a.goal.targetDate.localeCompare(b.goal.targetDate)),
        [data.goals, data.milestones, today]
    )
    const activeGoals = goals.filter(g => g.goal.status === 'active')
    const behind = activeGoals.filter(g => g.pace.behind).length

    const score = useMemo(() => dailyScore(data, today), [data, today])

    const openCreate = () => setDialog({ open: true, key: `new-${Date.now()}` })

    return (
        <>
            <Reveal index={0}>
                <PageHeader
                    // Both depend on the reader's clock, so they wait for the client
                    // rather than rendering the server's time and correcting it.
                    title={ready ? greeting() : '\u00A0'}
                    description={ready ? longDateLabel(today) : '\u00A0'}
                    actions={<TasksLink server={server} />}
                />
            </Reveal>

            {ready && (
                <>
                    <IntroBanner index={1} />

                    <Reveal index={2}>
                        <StatGrid columns={4}>
                            <Stat
                                label="Today"
                                value={score.value}
                                suffix="%"
                                detail={score.components.length === 0 ? 'Nothing scheduled' : score.value === 100 ? 'Everything done' : 'of habits and routines'}
                                visual={<Ring percent={score.value} />}
                            />
                            <Stat label="Habits" value={habitsDone} suffix={`/${habits.length}`} detail={habits.length === 0 ? 'None today' : habits.length === habitsDone ? 'All done' : `${habits.length - habitsDone} to go`} />
                            <Stat label="Routine steps" value={stepsDone} suffix={`/${stepsTotal}`} detail={stepsTotal - stepsDone === 0 ? (stepsTotal === 0 ? 'None today' : 'All done') : `${stepsTotal - stepsDone} to go`} />
                            <Stat
                                label="Goals"
                                value={activeGoals.length - behind}
                                suffix={`/${activeGoals.length}`}
                                detail={behind > 0 ? <span className={BEHIND.text}>{behind} behind pace</span> : 'All on track'}
                            />
                        </StatGrid>
                    </Reveal>

                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
                        <div className="flex flex-col gap-4">
                            {/* Habits */}
                            <Reveal index={3}>
                                <Card>
                                    <CardHeader
                                        title="Habits"
                                        meta={habits.length > 0 ? `${habitsDone} of ${habits.length}` : undefined}
                                        action={<ViewAll href="/second-brain/habits" />}
                                    />

                                    {data.habits.length === 0 ? (
                                        <EmptyState
                                            compact
                                            title="No habits yet"
                                            description="Add one and it shows up here on the days it's due."
                                            action={<Button size="sm" icon={Plus} onClick={openCreate}>New habit</Button>}
                                        />
                                    ) : habits.length === 0 ? (
                                        <EmptyState compact title="Nothing due today" description="Enjoy the rest day." />
                                    ) : (
                                        groups.map(({ slot, habits: slotHabits }) => (
                                            <div key={slot}>
                                                <div className={cn('flex h-8 items-center border-b bg-black/[0.015] px-4 dark:bg-white/[0.02]', HAIRLINE, groups[0].slot !== slot && 'border-t')}>
                                                    <span className={cn(T.caption, INK.subtle)}>{TIME_OF_DAY_LABEL[slot]}</span>
                                                </div>
                                                <div className={cn('divide-y', DIVIDE)}>
                                                    {slotHabits.map(habit => {
                                                        const done = isDone(habit.id, today)
                                                        const weekly = isWeeklyCount(habit)
                                                        const streak = habitStreak(habit, isDone, today)

                                                        return (
                                                            <button
                                                                key={habit.id}
                                                                type="button"
                                                                onClick={() => toggleHabit(habit.id, today)}
                                                                aria-pressed={done}
                                                                className={cn(
                                                                    'group flex h-11 w-full items-center gap-3 px-4 text-left', HOVER, TRANSITION.fast,
                                                                    FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
                                                                )}
                                                            >
                                                                <Checkbox checked={done} />
                                                                <ItemIcon icon={habit.icon} className={cn(ICON.md, 'shrink-0 transition-colors duration-200', done ? INK.subtle : INK.muted)} />
                                                                <Strike done={done} className={cn('min-w-0 flex-1', T.body)}>{habit.name}</Strike>
                                                                <span className={cn('shrink-0', T.meta, NUM, INK.subtle)}>
                                                                    {weekly ? (
                                                                        <span className={cn(weekHits(habit, isDone, today) >= weeklyTarget(habit)! && DONE.text)}>
                                                                            {weekHits(habit, isDone, today)} of {weeklyTarget(habit)} this week
                                                                        </span>
                                                                    ) : streak > 0 ? (
                                                                        <span className="inline-flex items-center gap-1" title={`${streak} day streak`}>
                                                                            <Flame className={ICON.sm} strokeWidth={2.25} />
                                                                            {streak}
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </Card>
                            </Reveal>

                            {/* Goals */}
                            <Reveal index={4}>
                                <Card>
                                    <CardHeader
                                        title="Goals"
                                        meta={activeGoals.length > 0 ? (behind > 0 ? `${behind} behind` : 'All on track') : undefined}
                                        action={<ViewAll href="/second-brain/goals" />}
                                    />
                                    {goals.length === 0 ? (
                                        <EmptyState
                                            compact
                                            title="No goals in progress"
                                            action={
                                                <Link href="/second-brain/goals" className={cn('inline-flex h-7 items-center gap-1.5 border bg-card px-2.5', R.md, HAIRLINE, T.button, 'text-[12.5px]', TRANSITION.fast, 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]', FOCUS)}>
                                                    <Plus className={ICON.md} strokeWidth={2} />
                                                    Set a goal
                                                </Link>
                                            }
                                        />
                                    ) : (
                                        <div className={cn('divide-y', DIVIDE)}>
                                            {goals.slice(0, 4).map(({ goal, pace }) => (
                                                <GoalRow
                                                    key={goal.id}
                                                    goal={goal}
                                                    milestones={data.milestones}
                                                    pace={pace}
                                                    onOpen={id => router.push(`/second-brain/goals?goal=${id}`)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </Reveal>
                        </div>

                        {/* Routines */}
                        <Reveal index={5}>
                            <Card>
                                <CardHeader
                                    title="Routines"
                                    meta={stepsTotal > 0 ? `${stepsDone} of ${stepsTotal} steps` : undefined}
                                    action={<ViewAll href="/second-brain/routines" />}
                                />
                                {routines.length === 0 ? (
                                    <EmptyState compact title="No routines today" description="Routines scheduled for today appear here." />
                                ) : (
                                    <div className={cn('divide-y', DIVIDE)}>
                                        {routines.map(({ routine, steps, progress }) => (
                                            <div key={routine.id}>
                                                <div className="flex h-12 items-center gap-3 px-4">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-black/[0.04] dark:bg-white/[0.06]">
                                                        <ItemIcon icon={routine.icon} className={cn(ICON.md, INK.default)} />
                                                    </span>
                                                    <span className={cn('min-w-0 flex-1 truncate', T.body, 'font-medium', INK.strong)}>{routine.name}</span>
                                                    <span className={cn('flex items-center gap-2', T.meta, 'font-medium', NUM, progress.percent === 100 ? DONE.text : INK.muted)}>
                                                        {progress.done}/{progress.expected}
                                                        <Ring percent={progress.percent} size={16} stroke={2.5} />
                                                    </span>
                                                </div>
                                                <div className="pb-1.5">
                                                    {steps.map(step => (
                                                        <StepRow key={step.id} step={step} done={doneSteps.has(step.id)} date={today} inset />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Reveal>
                    </div>
                </>
            )}

            <HabitDialog
                key={dialog.key}
                open={dialog.open}
                onOpenChange={open => setDialog(prev => ({ ...prev, open }))}
                habit={null}
            />
        </>
    )
}
