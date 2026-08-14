'use client'

import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from './empty-state'
import { ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitIcon } from '@/lib/second-brain/icons'
import { SectionHeader, ProgressBar, Panel, StatusBadge } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey, weekDays } from '@/lib/second-brain/date'
import {
    buildEntryIndex, lookupFrom, habitCompletion, goalProgress, goalPace,
} from '@/lib/second-brain/domain/selectors'
import { FOCUS, HAIRLINE, HOVER, ICON, INK, LABEL, META, NUM, R, T } from '@/lib/second-brain/ui'

/**
 * Areas of responsibility (PARA).
 *
 * An area has no finish line, so it gets no progress bar of its own. What it
 * shows instead is health: the habits and goals filed under it, and how those are
 * actually doing this week. That is the only honest way to answer "am I holding
 * my standard here?" — which is the question an area exists to answer.
 */
export function AreasView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, update } = useSecondBrainActions()

    const [expanded, setExpanded] = useState<string | null>(null)

    const today = todayKey()
    const week = useMemo(() => weekDays(new Date()), [])

    const isDone = useMemo(
        () => lookupFrom(buildEntryIndex(data.habitEntries)),
        [data.habitEntries]
    )

    const areas = useMemo(
        () =>
            data.areas
                .filter(area => area.archivedAt === null)
                .map(area => {
                    const habits = data.habits.filter(h => h.archivedAt === null && h.areaId === area.id)
                    const goals = data.goals.filter(g => g.archivedAt === null && g.areaId === area.id)

                    // Health = how the area's habits actually went this week.
                    const totals = habits.reduce(
                        (acc, habit) => {
                            const c = habitCompletion(habit, isDone, week, today)
                            return { done: acc.done + c.done, expected: acc.expected + c.expected }
                        },
                        { done: 0, expected: 0 }
                    )

                    const health =
                        totals.expected === 0 ? null : Math.round((totals.done / totals.expected) * 100)

                    const behind = goals.filter(
                        goal => goalPace(goal, data.milestones, today).behind && goal.status !== 'achieved'
                    ).length

                    return { area, habits, goals, health, behind }
                }),
        [data.areas, data.habits, data.goals, data.milestones, isDone, week, today]
    )

    const addArea = useCallback(() => {
        const stamp = new Date().toISOString()
        const area = {
            id: createId('area'),
            createdAt: stamp,
            updatedAt: stamp,
            archivedAt: null,
            name: 'New area',
            icon: 'target',
            description: '',
            standard: '',
        }
        create('areas', area)
        setExpanded(area.id)
    }, [create])

    if (!ready) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-[150px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <SectionHeader
                title="Areas"
                count={areas.length}
                action={
                    <button
                        type="button"
                        onClick={addArea}
                        className={cn('flex items-center gap-1 px-1.5 py-1', R.sm, T.label, INK.muted,
                            'transition-colors hover:text-foreground', FOCUS)}
                    >
                        <Plus className="h-3 w-3" />
                        New area
                    </button>
                }
            />

            {areas.length === 0 ? (
                <EmptyState
                    title="No areas yet"
                    description="Areas are the parts of life you maintain — health, career, finance. They never finish, which is what separates them from goals."
                />
            ) : (
                <div className="flex flex-col gap-3">
                    {areas.map(({ area, habits, goals, health, behind }) => {
                        const isOpen = expanded === area.id

                        return (
                            <Panel key={area.id} padded={false}>
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : area.id)}
                                    aria-expanded={isOpen}
                                    className={cn('flex w-full flex-col gap-3 px-4 py-3.5 text-left',
                                        R.lg, HOVER, FOCUS, 'transition-colors')}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <ChevronRight
                                                className={cn('h-3.5 w-3.5 shrink-0 transition-transform',
                                                    INK.subtle, isOpen && 'rotate-90')}
                                            />
                                            <HabitIcon icon={area.icon} className={cn(ICON.md, "shrink-0 text-foreground/60")} />
                                            <span className={cn('truncate', T.title, INK.strong)}>{area.name}</span>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            {behind > 0 && (
                                                <StatusBadge tone="warning">
                                                    {behind} behind
                                                </StatusBadge>
                                            )}
                                            {health !== null && (
                                                <span className={cn('text-[11px]', NUM, INK.muted)}>
                                                    {health}% this week
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* No bar when the area has no habits — an empty bar
                                        would read as 0%, which is not the same as "nothing
                                        is being measured here yet". */}
                                    {health !== null && <ProgressBar percent={health} />}

                                    <div className={cn('flex flex-wrap gap-x-4 text-[11px]', NUM, INK.subtle)}>
                                        <span>{habits.length} {habits.length === 1 ? 'habit' : 'habits'}</span>
                                        <span>{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className={cn('flex flex-col gap-6 border-t px-4 py-4', HAIRLINE)}>
                                        <label className="flex flex-col gap-1.5">
                                            <span className={LABEL}>Description</span>
                                            <textarea
                                                value={area.description}
                                                onChange={e => update('areas', area.id, { description: e.target.value })}
                                                rows={2}
                                                placeholder="What does this part of life cover?"
                                                className={cn('w-full resize-none border bg-transparent px-2.5 py-2',
                                                    R.md, T.body, HAIRLINE,
                                                    'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                            />
                                        </label>

                                        <label className="flex flex-col gap-1.5">
                                            <span className={LABEL}>Standard</span>
                                            <textarea
                                                value={area.standard}
                                                onChange={e => update('areas', area.id, { standard: e.target.value })}
                                                rows={2}
                                                placeholder="What does holding the line look like here?"
                                                className={cn('w-full resize-none border bg-transparent px-2.5 py-2',
                                                    R.md, T.body, HAIRLINE,
                                                    'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                            />
                                        </label>

                                        {habits.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                <span className={LABEL}>Habits</span>
                                                {habits.map(habit => {
                                                    const c = habitCompletion(habit, isDone, week, today)
                                                    return (
                                                        <div key={habit.id} className="flex items-center gap-3 px-1">
                                                            <HabitIcon icon={habit.icon} className={cn(ICON.md, "shrink-0 text-foreground/55")} />
                                                            <span className={cn('flex-1 truncate', T.body, INK.default)}>
                                                                {habit.name}
                                                            </span>
                                                            <span className={cn(META.narrow, 'text-[11px]', NUM, INK.muted)}>
                                                                {c.expected === 0 ? '—' : `${c.percent}%`}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {goals.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                <span className={LABEL}>Goals</span>
                                                {goals.map(goal => {
                                                    const progress = goalProgress(goal, data.milestones)
                                                    const pace = goalPace(goal, data.milestones, today)
                                                    return (
                                                        <div key={goal.id} className="flex items-center gap-3 px-1">
                                                            <span className={cn('flex-1 truncate', T.body, INK.default)}>
                                                                {goal.title}
                                                            </span>
                                                            {pace.behind && goal.status !== 'achieved' && (
                                                                <StatusBadge tone="warning">Behind</StatusBadge>
                                                            )}
                                                            <span className={cn('w-9 shrink-0 text-right text-[11px]', NUM, INK.muted)}>
                                                                {progress}%
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Panel>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
