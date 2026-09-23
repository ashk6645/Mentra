'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { ProgressBar, Status } from './primitives'
import { timeLeftLabel } from '@/lib/second-brain/date'
import type { GoalPace } from '@/lib/second-brain/domain/selectors'
import type { Goal, Milestone } from '@/lib/second-brain/domain/types'
import { FOCUS, HOVER, INK, NUM, T, TRANSITION } from '@/lib/second-brain/ui'

/** The one word that says how a goal is doing. */
export function GoalStatus({ goal, pace }: { goal: Goal; pace: GoalPace }) {
    if (goal.status === 'achieved') return <Status tone="done">Achieved</Status>
    if (goal.status === 'paused') return <Status>Paused</Status>
    if (pace.behind) return <Status tone="behind">Behind</Status>
    return <Status>On track</Status>
}

/** "6 of 12 books", or "2 of 4 milestones". */
export function measureLabel(goal: Goal, milestones: Milestone[]): string {
    if (goal.target !== null) return `${goal.current} of ${goal.target}${goal.metric ? ` ${goal.metric}` : ''}`

    const own = milestones.filter(m => m.goalId === goal.id)
    if (own.length === 0) return 'No milestones yet'
    return `${own.filter(m => m.completedAt).length} of ${own.length} milestones`
}

/**
 * One goal in a list: what it is, how far along, and whether that's enough.
 * Progress is always shown against the time left — a bar alone can't say
 * whether 40% is good news.
 */
export const GoalRow = memo(function GoalRow({
    goal,
    milestones,
    pace,
    onOpen,
}: {
    goal: Goal
    milestones: Milestone[]
    pace: GoalPace
    onOpen: (id: string) => void
}) {
    const done = goal.status === 'achieved'

    return (
        <button
            type="button"
            onClick={() => onOpen(goal.id)}
            className={cn(
                'flex w-full flex-col gap-2.5 px-4 py-3.5 text-left', HOVER, TRANSITION.fast,
                FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
            )}
        >
            <div className="flex items-center gap-3">
                <span className={cn(T.body, 'min-w-0 flex-1 truncate font-medium', goal.title ? INK.strong : INK.subtle)}>
                    {goal.title || 'Untitled goal'}
                </span>
                <GoalStatus goal={goal} pace={pace} />
                <span className={cn('w-10 text-right', T.meta, 'font-medium', NUM, INK.default)}>{pace.progress}%</span>
            </div>

            <ProgressBar percent={pace.progress} complete={done} label={`${goal.title} progress`} />

            <div className={cn('flex items-center justify-between gap-3', T.meta, NUM, INK.subtle)}>
                <span className="truncate">{measureLabel(goal, milestones)}</span>
                <span className="shrink-0">{done ? 'Done' : goal.status === 'paused' ? 'On hold' : timeLeftLabel(pace.daysLeft)}</span>
            </div>
        </button>
    )
})
