'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitIcon } from '@/lib/second-brain/icons'
import { SBCheckbox } from './checkbox'
import { SectionHeader, ProgressBar, Panel, StatusBadge } from './primitives'
import { EmptyState } from './empty-state'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey } from '@/lib/second-brain/date'
import { isRoutineScheduledOn, routineProgress, routineMinutes } from '@/lib/second-brain/domain/selectors'
import { TIME_OF_DAY_LABEL, type Routine, type RoutineStep } from '@/lib/second-brain/domain/types'
import { R, T, INK, NUM, FOCUS, HOVER, HAIRLINE, LABEL } from '@/lib/second-brain/ui'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "Every day" / "Weekdays" / "Mon, Wed, Fri" */
function scheduleLabel(days: number[]): string {
    if (days.length === 0 || days.length === 7) return 'Every day'

    const sorted = [...days].sort((a, b) => a - b)
    if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Weekdays'
    if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return 'Weekends'

    return sorted.map(d => DAY_NAMES[d]).join(', ')
}

/**
 * Routines.
 *
 * A routine is an ordered sequence, which is what separates it from a habit —
 * so order is editable here, and the per-day completion resets each morning
 * rather than accumulating a streak.
 */
export function RoutinesView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, replace, update } = useSecondBrainActions()

    const [addingTo, setAddingTo] = useState<string | null>(null)
    const [draftStep, setDraftStep] = useState('')

    const date = todayKey()

    const routines = useMemo(
        () =>
            data.routines
                .filter(r => r.archivedAt === null)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(routine => {
                    const steps = data.routineSteps
                        .filter(step => step.routineId === routine.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder)

                    return {
                        routine,
                        steps,
                        progress: routineProgress(steps, data.routineStepEntries, date),
                        minutes: routineMinutes(steps),
                        scheduledToday: isRoutineScheduledOn(routine, date),
                    }
                }),
        [data.routines, data.routineSteps, data.routineStepEntries, date]
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

    /** Clear today's progress for one routine. Yesterday's history is untouched. */
    const resetRoutine = useCallback(
        (steps: RoutineStep[]) => {
            const ids = new Set(steps.map(s => s.id))
            replace(
                'routineStepEntries',
                data.routineStepEntries.filter(e => !(ids.has(e.stepId) && e.date === date))
            )
        },
        [data.routineStepEntries, date, replace]
    )

    /**
     * Move a step up or down.
     *
     * Swaps sortOrder with the neighbour rather than renumbering the list, so
     * only two records change and concurrent edits elsewhere aren't clobbered.
     */
    const moveStep = useCallback(
        (steps: RoutineStep[], index: number, direction: -1 | 1) => {
            const target = index + direction
            if (target < 0 || target >= steps.length) return

            const a = steps[index]
            const b = steps[target]

            replace(
                'routineSteps',
                data.routineSteps.map(step => {
                    if (step.id === a.id) return { ...step, sortOrder: b.sortOrder }
                    if (step.id === b.id) return { ...step, sortOrder: a.sortOrder }
                    return step
                })
            )
        },
        [data.routineSteps, replace]
    )

    const addStep = useCallback(
        (routine: Routine, steps: RoutineStep[]) => {
            const title = draftStep.trim()
            if (!title) {
                setAddingTo(null)
                return
            }

            const stamp = new Date().toISOString()
            create('routineSteps', {
                id: createId('step'),
                createdAt: stamp,
                updatedAt: stamp,
                routineId: routine.id,
                title,
                estimatedMinutes: null,
                sortOrder: steps.length,
            })

            setDraftStep('')
        },
        [create, draftStep]
    )

    const deleteStep = useCallback(
        (stepId: string) => {
            replace('routineSteps', data.routineSteps.filter(s => s.id !== stepId))
            // Drop its history too, so a re-created step never inherits old ticks.
            replace('routineStepEntries', data.routineStepEntries.filter(e => e.stepId !== stepId))
        },
        [data.routineSteps, data.routineStepEntries, replace]
    )

    const addRoutine = useCallback(() => {
        const stamp = new Date().toISOString()
        create('routines', {
            id: createId('routine'),
            createdAt: stamp,
            updatedAt: stamp,
            archivedAt: null,
            name: 'New routine',
            icon: 'sunrise',
            timeOfDay: 'morning',
            days: [],
            sortOrder: data.routines.length,
        })
    }, [create, data.routines.length])

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                {[0, 1].map(i => (
                    <div key={i} className="h-[220px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                ))}
            </div>
        )
    }

    if (routines.length === 0) {
        return (
            <EmptyState onAdd={addRoutine} />
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <SectionHeader
                title="Routines"
                count={routines.length}
                action={
                    <button
                        type="button"
                        onClick={addRoutine}
                        className={cn('flex items-center gap-1 px-1.5 py-1', R.sm, T.label, INK.muted,
                            'transition-colors hover:text-foreground', FOCUS)}
                    >
                        <Plus className="h-3 w-3" />
                        New routine
                    </button>
                }
            />

            <div className="flex flex-col gap-4">
                {routines.map(({ routine, steps, progress, minutes, scheduledToday }) => (
                    <Panel key={routine.id} padded={false}>
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <HabitIcon icon={routine.icon} className="h-[15px] w-[15px] shrink-0 text-foreground/60" />
                                <input
                                    value={routine.name}
                                    onChange={e => update('routines', routine.id, { name: e.target.value })}
                                    aria-label="Routine name"
                                    className={cn(
                                        'min-w-0 flex-1 bg-transparent outline-none', T.title, INK.strong,
                                        R.sm, 'px-1 -mx-1 focus:bg-foreground/[0.04]'
                                    )}
                                />
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <StatusBadge tone={scheduledToday ? 'info' : 'neutral'}>
                                    {TIME_OF_DAY_LABEL[routine.timeOfDay]} · {scheduleLabel(routine.days)}
                                </StatusBadge>

                                {minutes > 0 && (
                                    <span className={cn('text-[11px]', NUM, INK.subtle)}>~{minutes}m</span>
                                )}

                                <span className={cn('text-[11px]', NUM, INK.muted)}>
                                    {progress.done}/{progress.expected}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => resetRoutine(steps)}
                                    disabled={progress.done === 0}
                                    title="Clear today's progress"
                                    aria-label="Reset routine for today"
                                    className={cn('flex h-6 w-6 shrink-0 items-center justify-center', R.sm, INK.muted,
                                        'transition-colors hover:bg-foreground/[0.06] hover:text-foreground',
                                        'disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </button>
                            </div>
                        </div>

                        <ProgressBar percent={progress.percent} className="mx-4" />

                        <ol className="flex flex-col px-2 py-2">
                            {steps.map((step, index) => {
                                const done = data.routineStepEntries.some(
                                    e => e.stepId === step.id && e.date === date
                                )

                                return (
                                    <li key={step.id} className="group flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleStep(step.id)}
                                            aria-pressed={done}
                                            className={cn('flex flex-1 items-center gap-3 px-2 py-2 text-left',
                                                R.md, HOVER, FOCUS, 'transition-colors')}
                                        >
                                            <SBCheckbox checked={done} size="sm" />
                                            <span className={cn('flex-1', T.body,
                                                done ? 'text-muted-foreground line-through decoration-foreground/25' : INK.default)}>
                                                {step.title}
                                            </span>
                                            {step.estimatedMinutes !== null && (
                                                <span className={cn('text-[11px]', NUM, INK.subtle)}>
                                                    {step.estimatedMinutes}m
                                                </span>
                                            )}
                                        </button>

                                        {/*
                                          * Reorder and delete.
                                          *
                                          * Width is always reserved so revealing them doesn't
                                          * shift the row, and it is exactly 3×24 + 2×2 — at 68px
                                          * the three buttons were squeezed to 21px wide, under
                                          * the 24px minimum target.
                                          *
                                          * They stay visible below `sm`: touch has no hover, so
                                          * hiding them there makes reordering unreachable rather
                                          * than merely subtle.
                                          */}
                                        <div className="flex w-[76px] shrink-0 items-center gap-0.5 opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => moveStep(steps, index, -1)}
                                                disabled={index === 0}
                                                aria-label={`Move ${step.title} up`}
                                                className={cn('flex h-6 w-6 shrink-0 items-center justify-center', R.sm, INK.muted,
                                                    'hover:bg-foreground/[0.06] hover:text-foreground',
                                                    'disabled:pointer-events-none disabled:opacity-25', FOCUS)}
                                            >
                                                <ChevronUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveStep(steps, index, 1)}
                                                disabled={index === steps.length - 1}
                                                aria-label={`Move ${step.title} down`}
                                                className={cn('flex h-6 w-6 shrink-0 items-center justify-center', R.sm, INK.muted,
                                                    'hover:bg-foreground/[0.06] hover:text-foreground',
                                                    'disabled:pointer-events-none disabled:opacity-25', FOCUS)}
                                            >
                                                <ChevronDown className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteStep(step.id)}
                                                aria-label={`Delete ${step.title}`}
                                                className={cn('flex h-6 w-6 shrink-0 items-center justify-center', R.sm, INK.muted,
                                                    'hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400', FOCUS)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}

                            <li>
                                {addingTo === routine.id ? (
                                    <input
                                        autoFocus
                                        value={draftStep}
                                        onChange={e => setDraftStep(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') addStep(routine, steps)
                                            if (e.key === 'Escape') {
                                                setDraftStep('')
                                                setAddingTo(null)
                                            }
                                        }}
                                        onBlur={() => addStep(routine, steps)}
                                        placeholder="Add a step…"
                                        className={cn('mx-2 w-[calc(100%-1rem)] border bg-transparent px-2.5 py-2',
                                            R.md, T.body, HAIRLINE,
                                            'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingTo(routine.id)
                                            setDraftStep('')
                                        }}
                                        className={cn('flex w-full items-center gap-2.5 px-2 py-2',
                                            R.md, T.body, INK.subtle, HOVER, FOCUS,
                                            'transition-colors hover:text-foreground')}
                                    >
                                        <span className="flex h-[17px] w-[17px] items-center justify-center">
                                            <Plus className="h-3.5 w-3.5" />
                                        </span>
                                        Add step
                                    </button>
                                )}
                            </li>
                        </ol>
                    </Panel>
                ))}
            </div>
        </div>
    )
}

export { LABEL }
