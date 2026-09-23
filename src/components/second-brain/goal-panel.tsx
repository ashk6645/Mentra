'use client'

import { useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from './checkbox'
import { ActionMenu } from './menu'
import { PanelClose } from './overlay'
import { Button, IconButton, ProgressBar } from './primitives'
import { Segmented } from './segmented'
import { DateInput, Stepper, TextInput } from './fields'
import { GoalStatus, measureLabel } from './goal-row'
import {
    addMilestone, deleteGoal, deleteMilestone, renameMilestone, toggleMilestone, updateGoal,
} from '@/lib/second-brain/actions'
import { timeLeftLabel } from '@/lib/second-brain/date'
import { goalPace } from '@/lib/second-brain/domain/selectors'
import { GOAL_STATUS_LABEL, type Goal, type GoalStatus as Status, type Milestone } from '@/lib/second-brain/domain/types'
import { FOCUS, HAIRLINE, HOVER, ICON, INK, NUM, T, TRANSITION } from '@/lib/second-brain/ui'

const STATUSES = (['active', 'paused', 'achieved'] as Status[]).map(id => ({ id, label: GOAL_STATUS_LABEL[id] }))

const MEASURES = [
    { id: 'milestones' as const, label: 'Milestones' },
    { id: 'number' as const, label: 'A number' },
]

/** A property row: label on the left, control on the right — Linear's detail layout. */
function Property({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid min-h-9 grid-cols-[112px_1fr] items-center gap-3">
            <span className={cn(T.meta, INK.muted)}>{label}</span>
            <div className="flex min-w-0 items-center gap-2">{children}</div>
        </div>
    )
}

/** Borderless text that looks like the page until you touch it. */
const QUIET = cn(
    'w-full resize-none bg-transparent outline-none [field-sizing:content]',
    'placeholder:text-muted-foreground/45'
)

function MilestoneRow({ milestone }: { milestone: Milestone }) {
    const done = milestone.completedAt !== null

    return (
        <div className={cn('group flex h-10 items-center gap-3 px-2', HOVER, TRANSITION.fast, 'rounded-[8px]')}>
            <button
                type="button"
                onClick={() => toggleMilestone(milestone)}
                aria-pressed={done}
                aria-label={done ? `Mark “${milestone.title}” not done` : `Mark “${milestone.title}” done`}
                className={cn('group flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]', FOCUS)}
            >
                <Checkbox checked={done} size="sm" />
            </button>
            <input
                value={milestone.title}
                onChange={e => renameMilestone(milestone.id, e.target.value)}
                aria-label="Milestone"
                maxLength={120}
                className={cn(
                    'min-w-0 flex-1 bg-transparent outline-none', T.body,
                    'transition-colors duration-200',
                    done ? cn(INK.subtle, 'line-through decoration-foreground/30') : INK.strong
                )}
            />
            <IconButton
                icon={X}
                label={`Remove “${milestone.title}”`}
                size="sm"
                onClick={() => deleteMilestone(milestone)}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-60"
            />
        </div>
    )
}

function AddMilestone({ goalId }: { goalId: string }) {
    const [draft, setDraft] = useState('')

    return (
        <div className="flex h-10 items-center gap-3 px-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <Plus className={cn(ICON.md, INK.subtle)} strokeWidth={2} />
            </span>
            <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        addMilestone(goalId, draft)
                        setDraft('')
                    }
                }}
                onBlur={() => {
                    addMilestone(goalId, draft)
                    setDraft('')
                }}
                placeholder="Add a milestone"
                aria-label="New milestone"
                maxLength={120}
                className={cn('min-w-0 flex-1 bg-transparent outline-none', T.body, INK.strong, 'placeholder:text-muted-foreground/55')}
            />
        </div>
    )
}

/**
 * Everything about one goal, edited in place.
 *
 * No Save button: every change is written as it's made, the way a document
 * behaves. The panel is for thinking about a goal — why it matters, how it's
 * measured, what's next — so it reads top to bottom in that order.
 */
export function GoalPanel({
    goal,
    milestones,
    today,
    onDeleted,
}: {
    goal: Goal
    milestones: Milestone[]
    today: string
    onDeleted: () => void
}) {
    const pace = goalPace(goal, milestones, today)
    const own = milestones.filter(m => m.goalId === goal.id).sort((a, b) => a.sortOrder - b.sortOrder)
    const measured = goal.target !== null

    const setMeasure = (measure: 'milestones' | 'number') => {
        if (measure === 'number' && !measured) updateGoal(goal.id, { target: 10, current: 0, metric: goal.metric ?? '' })
        if (measure === 'milestones' && measured) updateGoal(goal.id, { target: null, metric: null })
    }

    return (
        <>
            <header className={cn('flex h-12 shrink-0 items-center justify-between gap-3 border-b pl-5 pr-3', HAIRLINE)}>
                <span className={cn(T.meta, INK.muted)}>Goal</span>
                <div className="flex items-center gap-1">
                    <ActionMenu
                        label="Goal actions"
                        actions={[{
                            label: 'Delete goal',
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => {
                                onDeleted()
                                deleteGoal(goal)
                            },
                        }]}
                    />
                    <PanelClose />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-7 px-5 py-6 sm:px-6">
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={goal.title}
                            onChange={e => updateGoal(goal.id, { title: e.target.value.replace(/\n/g, '') })}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    document.getElementById('goal-why')?.focus()
                                }
                            }}
                            autoFocus={goal.title === ''}
                            rows={1}
                            maxLength={120}
                            placeholder="Untitled goal"
                            aria-label="Goal title"
                            className={cn(QUIET, 'text-[20px] font-semibold leading-[1.3] tracking-[-0.02em]', INK.strong)}
                        />
                        <textarea
                            id="goal-why"
                            value={goal.why}
                            onChange={e => updateGoal(goal.id, { why: e.target.value })}
                            rows={1}
                            placeholder="Why does this matter?"
                            aria-label="Why it matters"
                            className={cn(QUIET, T.body, 'text-[13.5px] leading-[1.6]', INK.muted)}
                        />
                    </div>

                    {/* Progress, always against time. */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-end justify-between gap-3">
                            <span className={cn('text-[28px] font-semibold leading-none tracking-[-0.03em]', NUM, INK.strong)}>
                                {pace.progress}<span className={cn('ml-0.5 text-[16px] font-medium', INK.subtle)}>%</span>
                            </span>
                            {/* At 100% the obvious next step is offered, not left to be found. */}
                            {goal.status === 'active' && pace.progress === 100 ? (
                                <Button size="sm" variant="primary" icon={Check} onClick={() => updateGoal(goal.id, { status: 'achieved' })}>
                                    Mark achieved
                                </Button>
                            ) : (
                                <GoalStatus goal={goal} pace={pace} />
                            )}
                        </div>
                        <ProgressBar percent={pace.progress} complete={goal.status === 'achieved'} label="Progress" />
                        <p className={cn(T.meta, NUM, INK.subtle)}>
                            {measureLabel(goal, milestones)}
                            {goal.status === 'active' && ` · ${pace.elapsed}% of the time gone · ${timeLeftLabel(pace.daysLeft)}`}
                        </p>
                    </div>

                    <div className={cn('flex flex-col gap-1 border-t pt-5', HAIRLINE)}>
                        <Property label="Status">
                            <Segmented options={STATUSES} value={goal.status} onChange={status => updateGoal(goal.id, { status })} ariaLabel="Status" />
                        </Property>
                        <Property label="Started">
                            <DateInput
                                value={goal.startDate}
                                max={goal.targetDate}
                                onChange={e => e.target.value && updateGoal(goal.id, { startDate: e.target.value })}
                                aria-label="Start date"
                            />
                        </Property>
                        <Property label="Target date">
                            <DateInput
                                value={goal.targetDate}
                                min={goal.startDate}
                                onChange={e => e.target.value && updateGoal(goal.id, { targetDate: e.target.value })}
                                aria-label="Target date"
                            />
                        </Property>
                        <Property label="Measured by">
                            <Segmented options={MEASURES} value={measured ? 'number' : 'milestones'} onChange={setMeasure} ariaLabel="Measured by" />
                        </Property>

                        {measured && (
                            <>
                                <Property label="Unit">
                                    <TextInput
                                        value={goal.metric ?? ''}
                                        onChange={e => updateGoal(goal.id, { metric: e.target.value })}
                                        placeholder="books, kg, km…"
                                        aria-label="Unit"
                                        maxLength={24}
                                        className="w-40"
                                    />
                                </Property>
                                <Property label="Target">
                                    <Stepper value={goal.target ?? 0} onChange={target => updateGoal(goal.id, { target: Math.max(1, target) })} min={1} label="Target" />
                                </Property>
                                <Property label="Current">
                                    <Stepper value={goal.current} onChange={current => updateGoal(goal.id, { current })} label="Current" />
                                </Property>
                            </>
                        )}
                    </div>

                    <div className={cn('flex flex-col gap-2 border-t pt-5', HAIRLINE)}>
                        <div className="flex items-baseline justify-between">
                            <h3 className={cn(T.title, 'text-[13px]', INK.strong)}>Milestones</h3>
                            {measured && own.length > 0 && (
                                <span className={cn(T.meta, INK.subtle)}>Progress follows the number above</span>
                            )}
                        </div>
                        <div className={'-mx-2 flex flex-col'}>
                            {own.map(milestone => <MilestoneRow key={milestone.id} milestone={milestone} />)}
                            <AddMilestone goalId={goal.id} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
