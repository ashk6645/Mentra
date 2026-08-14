'use client'

import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from './empty-state'
import { ChevronRight, Plus, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitIcon } from '@/lib/second-brain/icons'
import { SBCheckbox } from './checkbox'
import { SectionHeader, ProgressBar, Panel, StatusBadge, Metric, MetricRow, Ring } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey, longDateLabel, fromDateKey } from '@/lib/second-brain/date'
import { goalProgress, goalPace } from '@/lib/second-brain/domain/selectors'
import type { Goal, GoalStatus } from '@/lib/second-brain/domain/types'
import { FOCUS, HAIRLINE, HOVER, ICON, INK, LABEL, META, NUM, R, ROW, T } from '@/lib/second-brain/ui'

const STATUS_LABEL: Record<GoalStatus, string> = {
    not_started: 'Not started',
    active: 'Active',
    at_risk: 'At risk',
    achieved: 'Achieved',
    paused: 'Paused',
    abandoned: 'Abandoned',
}

/*
 * Same rule as the library: colour marks the exceptions, not the norm.
 *
 * "Active" is the state most goals are in most of the time — colouring it blue
 * put a filled pill on nearly every row and left nothing for the states that
 * actually want attention. At risk and achieved keep their tone because they are
 * genuinely worth interrupting for.
 */
const STATUS_TONE: Record<GoalStatus, 'neutral' | 'warning' | 'success'> = {
    not_started: 'neutral',
    active: 'neutral',
    at_risk: 'warning',
    achieved: 'success',
    paused: 'neutral',
    abandoned: 'neutral',
}

/** Statuses that count as "in play" for the default filter. */
const OPEN: GoalStatus[] = ['not_started', 'active', 'at_risk']

/** Days remaining, or how far overdue. */
function timeRemaining(targetDate: string, today: string): string {
    const days = Math.round(
        (fromDateKey(targetDate).getTime() - fromDateKey(today).getTime()) / 86400000
    )

    if (days === 0) return 'Due today'
    if (days < 0) return `${Math.abs(days)}d overdue`
    if (days < 31) return `${days}d left`

    const months = Math.round(days / 30)
    return `${months}mo left`
}

/**
 * Goals.
 *
 * Progress is measured against a target where one exists and milestones
 * otherwise, and pace is compared against elapsed time — so "behind" is derived
 * rather than a label the user has to remember to set. Spec §12 is explicit that
 * a goal must not be a decorative progress bar.
 */
export function GoalsView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, update } = useSecondBrainActions()

    const [showAll, setShowAll] = useState(false)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [draftMilestone, setDraftMilestone] = useState('')

    const today = todayKey()

    const goals = useMemo(() => {
        const visible = data.goals
            .filter(g => g.archivedAt === null)
            .filter(g => showAll || OPEN.includes(g.status))

        return visible
            .map(goal => ({
                goal,
                area: data.areas.find(a => a.id === goal.areaId) ?? null,
                milestones: data.milestones
                    .filter(m => m.goalId === goal.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder),
                progress: goalProgress(goal, data.milestones),
                pace: goalPace(goal, data.milestones, today),
            }))
            // Anything slipping surfaces first — that's the reason to open this page.
            .sort((a, b) => Number(b.pace.behind) - Number(a.pace.behind))
    }, [data.goals, data.areas, data.milestones, showAll, today])

    const summary = useMemo(() => {
        const open = data.goals.filter(g => g.archivedAt === null && OPEN.includes(g.status))
        const behind = open.filter(g => goalPace(g, data.milestones, today).behind).length
        const achieved = data.goals.filter(g => g.archivedAt === null && g.status === 'achieved').length
        const average =
            open.length === 0
                ? 0
                : Math.round(open.reduce((sum, g) => sum + goalProgress(g, data.milestones), 0) / open.length)

        return { open: open.length, behind, achieved, average }
    }, [data.goals, data.milestones, today])

    const toggleMilestone = useCallback(
        (id: string, done: boolean) => {
            update('milestones', id, { completedAt: done ? null : new Date().toISOString() })
        },
        [update]
    )

    const addMilestone = useCallback(
        (goalId: string, count: number) => {
            const title = draftMilestone.trim()
            if (!title) return

            const stamp = new Date().toISOString()
            create('milestones', {
                id: createId('ms'),
                createdAt: stamp,
                updatedAt: stamp,
                goalId,
                title,
                targetDate: null,
                completedAt: null,
                sortOrder: count,
            })
            setDraftMilestone('')
        },
        [create, draftMilestone]
    )

    const addGoal = useCallback(() => {
        const stamp = new Date().toISOString()
        const target = new Date()
        target.setMonth(target.getMonth() + 3)

        const goal: Goal = {
            id: createId('goal'),
            createdAt: stamp,
            updatedAt: stamp,
            archivedAt: null,
            title: 'New goal',
            why: '',
            horizon: 'quarterly',
            status: 'not_started',
            areaId: null,
            startDate: today,
            targetDate: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`,
            metric: null,
            target: null,
            current: 0,
        }

        create('goals', goal)
        setExpanded(goal.id)
    }, [create, today])

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                {[0, 1].map(i => (
                    <div key={i} className="h-[120px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <MetricRow>
                <Metric value={summary.open} label="Open goals" leading={<Ring percent={summary.average} />} />
                <Metric value={summary.average} suffix="%" label="Average progress" />
                <Metric
                    value={summary.behind}
                    label={summary.behind === 1 ? 'Goal behind pace' : 'Goals behind pace'}
                />
            </MetricRow>

            <div>
                <SectionHeader
                    title={showAll ? 'All goals' : 'Open goals'}
                    count={goals.length}
                    action={
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setShowAll(v => !v)}
                                className={cn('px-1.5 py-1', R.sm, T.label, INK.muted,
                                    'transition-colors hover:text-foreground', FOCUS)}
                            >
                                {showAll ? 'Show open only' : 'Show all'}
                            </button>
                            <button
                                type="button"
                                onClick={addGoal}
                                className={cn('flex items-center gap-1 px-1.5 py-1', R.sm, T.label, INK.muted,
                                    'transition-colors hover:text-foreground', FOCUS)}
                            >
                                <Plus className="h-3 w-3" />
                                New
                            </button>
                        </div>
                    }
                />

                {goals.length === 0 ? (
                    <EmptyState
                        title={showAll ? 'No goals yet' : 'No open goals'}
                        description="Goals turn an area you care about into something with a finish line."
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {goals.map(({ goal, area, milestones, progress, pace }) => {
                            const isOpen = expanded === goal.id
                            const doneCount = milestones.filter(m => m.completedAt !== null).length

                            return (
                                /*
                                 * A ruled row, not a card.
                                 *
                                 * Goals and Learning were the last two screens still
                                 * boxing their items, which made them read as a
                                 * different kind of thing from every other list. The
                                 * expand affordance is the chevron, not the border.
                                 */
                                <div key={goal.id} className={cn('border-b last:border-b-0', HAIRLINE)}>
                                    <button
                                        type="button"
                                        onClick={() => setExpanded(isOpen ? null : goal.id)}
                                        aria-expanded={isOpen}
                                        className={cn('flex w-full flex-col gap-3 px-2 py-3.5 text-left',
                                            R.lg, HOVER, FOCUS, 'transition-colors')}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <ChevronRight
                                                    className={cn('h-3.5 w-3.5 shrink-0 transition-transform',
                                                        INK.subtle, isOpen && 'rotate-90')}
                                                />
                                                <span className={cn('truncate', T.title, INK.strong)}>{goal.title}</span>
                                            </div>

                                            {/*
                                              * The "Behind" slot is reserved whether or not it is
                                              * filled, so the status badge sits at the same x on
                                              * every goal. Rendered conditionally it shunted the
                                              * status left on exactly the rows drawing the eye.
                                              */}
                                            <div className="flex shrink-0 items-center justify-end gap-2">
                                                <span className="flex w-[74px] justify-end">
                                                    {/*
                                                      * Suppressed when the status already says it.
                                                      * "Behind" is derived from pace and "At risk"
                                                      * is set by hand, so a goal that is both put
                                                      * two amber badges side by side telling you
                                                      * the same thing twice.
                                                      */}
                                                    {pace.behind
                                                        && goal.status !== 'achieved'
                                                        && goal.status !== 'at_risk' && (
                                                        <StatusBadge tone="warning">
                                                            <TrendingDown className={ICON.sm} />
                                                            Behind
                                                        </StatusBadge>
                                                    )}
                                                </span>
                                                <span className={cn(META.wide, 'flex justify-end')}>
                                                    <StatusBadge tone={STATUS_TONE[goal.status]}>
                                                        {STATUS_LABEL[goal.status]}
                                                    </StatusBadge>
                                                </span>
                                            </div>
                                        </div>

                                        <ProgressBar percent={progress} complete={goal.status === 'achieved'} />

                                        <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]', NUM, INK.muted)}>
                                            <span>
                                                {goal.target !== null
                                                    ? `${goal.current} of ${goal.target} ${goal.metric}`
                                                    : `${doneCount} of ${milestones.length} milestones`}
                                            </span>
                                            <span>{pace.elapsed}% of time gone</span>
                                            <span>{timeRemaining(goal.targetDate, today)}</span>
                                            {area && (
                                                <span className="flex items-center gap-1">
                                                    <HabitIcon icon={area.icon} className="h-3 w-3" />
                                                    {area.name}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-2 pb-4">
                                            {/* Why — the field that stops a goal being decorative. */}
                                            <div className="mb-5 flex flex-col gap-1.5">
                                                <span className={LABEL}>Why this matters</span>
                                                <textarea
                                                    value={goal.why}
                                                    onChange={e => update('goals', goal.id, { why: e.target.value })}
                                                    rows={2}
                                                    placeholder="If you can't answer this, it isn't a goal yet."
                                                    className={cn('w-full resize-none border bg-transparent px-2.5 py-2',
                                                        R.md, T.body, HAIRLINE,
                                                        'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                                />
                                            </div>

                                            {goal.target !== null && (
                                                <div className="mb-5 flex items-center gap-3">
                                                    <span className={LABEL}>Progress</span>
                                                    <input
                                                        type="number"
                                                        value={goal.current}
                                                        onChange={e =>
                                                            update('goals', goal.id, { current: Number(e.target.value) || 0 })
                                                        }
                                                        aria-label={`Current ${goal.metric}`}
                                                        className={cn('w-20 border bg-transparent px-2 py-1', R.sm, T.body, NUM,
                                                            HAIRLINE, 'outline-none focus:border-primary/40')}
                                                    />
                                                    <span className={cn(T.label, INK.muted)}>
                                                        of {goal.target} {goal.metric}
                                                    </span>
                                                </div>
                                            )}

                                            <span className={cn(LABEL, 'mb-2 block')}>Milestones</span>

                                            <div className="flex flex-col">
                                                {milestones.map(milestone => {
                                                    const done = milestone.completedAt !== null
                                                    return (
                                                        <button
                                                            key={milestone.id}
                                                            type="button"
                                                            onClick={() => toggleMilestone(milestone.id, done)}
                                                            aria-pressed={done}
                                                            className={cn(ROW, FOCUS, 'text-left')}
                                                        >
                                                            <SBCheckbox checked={done} size="sm" />
                                                            <span className={cn('flex-1', T.body,
                                                                done ? 'text-muted-foreground line-through decoration-foreground/25' : INK.default)}>
                                                                {milestone.title}
                                                            </span>
                                                            {milestone.targetDate && (
                                                                <span className={cn('text-[11px]', NUM, INK.subtle)}>
                                                                    {longDateLabel(milestone.targetDate).split(',')[1]?.trim()}
                                                                </span>
                                                            )}
                                                        </button>
                                                    )
                                                })}

                                                <input
                                                    value={expanded === goal.id ? draftMilestone : ''}
                                                    onChange={e => setDraftMilestone(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') addMilestone(goal.id, milestones.length)
                                                        if (e.key === 'Escape') setDraftMilestone('')
                                                    }}
                                                    placeholder="Add a milestone…"
                                                    className={cn('mt-1 w-full border bg-transparent px-2.5 py-2',
                                                        R.md, T.body, HAIRLINE,
                                                        'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
