'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SBCheckbox } from './checkbox'
import { Panel, StatusBadge } from './primitives'
import { useSecondBrainData, useSecondBrainActions, createId } from '@/lib/second-brain/repo'
import {
    previousPerformance, workoutVolume, estimatedOneRepMax, bestOneRepMax,
} from '@/lib/second-brain/domain/selectors'
import type { Workout, WorkoutSet, Exercise } from '@/lib/second-brain/domain/types'
import { FOCUS, HAIRLINE, HOVER, INK, LABEL, META, NUM, R, ROW, T } from '@/lib/second-brain/ui'

/** mm:ss, or h:mm:ss past an hour. */
function formatElapsed(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => String(n).padStart(2, '0')

    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Ticking clock for the session. Starts from the stored start time, so it survives a reload. */
function useElapsed(startedAt: string): string {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    return formatElapsed(now - new Date(startedAt).getTime())
}

/**
 * A single set row.
 *
 * `inputMode="decimal"` rather than `type="number"`: on iOS a number input opens a
 * keypad without a decimal point on some locales, and scroll-wheel changes on
 * desktop silently alter logged weights. Text plus a numeric keypad avoids both.
 */
function SetRow({
    set,
    index,
    previous,
    onChange,
    onComplete,
    onDelete,
}: {
    set: WorkoutSet
    index: number
    previous: string
    onChange: (patch: Partial<WorkoutSet>) => void
    onComplete: () => void
    onDelete: () => void
}) {
    const done = set.completedAt !== null

    return (
        <div
            className={cn(
                'group grid grid-cols-[24px_1fr_1fr_1fr_64px] items-center gap-2 px-1 py-1.5 sm:px-2',
                R.md, 'transition-colors',
                done ? 'bg-emerald-500/[0.06]' : HOVER
            )}
        >
            <span className={cn('text-center text-[12px]', NUM, INK.subtle)}>{index + 1}</span>

            <span className={cn('truncate text-[12px]', NUM, INK.subtle)} title="Last time">
                {previous}
            </span>

            <input
                value={set.weight ?? ''}
                onChange={e => {
                    const raw = e.target.value.replace(/[^\d.]/g, '')
                    onChange({ weight: raw === '' ? null : Number(raw) })
                }}
                inputMode="decimal"
                placeholder="kg"
                aria-label={`Set ${index + 1} weight`}
                className={cn(
                    'w-full border bg-transparent px-2 py-1.5 text-center', R.sm, NUM,
                    'text-[13px]', HAIRLINE,
                    'placeholder:text-muted-foreground/40 outline-none focus:border-primary/40'
                )}
            />

            <input
                value={set.reps ?? ''}
                onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '')
                    onChange({ reps: raw === '' ? null : Number(raw) })
                }}
                inputMode="numeric"
                placeholder="reps"
                aria-label={`Set ${index + 1} reps`}
                className={cn(
                    'w-full border bg-transparent px-2 py-1.5 text-center', R.sm, NUM,
                    'text-[13px]', HAIRLINE,
                    'placeholder:text-muted-foreground/40 outline-none focus:border-primary/40'
                )}
            />

            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    onClick={onComplete}
                    aria-label={`Mark set ${index + 1} ${done ? 'incomplete' : 'complete'}`}
                    aria-pressed={done}
                    className={cn('flex h-8 w-8 items-center justify-center', R.md, FOCUS,
                        'transition-colors hover:bg-foreground/[0.06]')}
                >
                    <SBCheckbox checked={done} size="sm" />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Delete set ${index + 1}`}
                    className={cn('flex h-8 w-8 shrink-0 items-center justify-center', R.sm, INK.subtle,
                        // Always visible on touch; hover-revealed from sm upward.
                        'opacity-50 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100',
                        'hover:text-red-600 dark:hover:text-red-400', FOCUS)}
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

interface ActiveWorkoutProps {
    workout: Workout
    onFinish: () => void
    onDiscard: () => void
}

/**
 * The set logger.
 *
 * Everything is written to the store as it is typed — a workout you lose because
 * you backgrounded the app is worse than no tracker at all. The whole session is
 * reconstructable from storage at any moment, including the elapsed clock, which
 * reads from `startedAt` rather than a counter held in memory.
 */
export function ActiveWorkout({ workout, onFinish, onDiscard }: ActiveWorkoutProps) {
    const data = useSecondBrainData()
    const { create, update, replace } = useSecondBrainActions()
    const [picking, setPicking] = useState(false)

    const elapsed = useElapsed(workout.startedAt)

    const sets = useMemo(
        () => data.workoutSets.filter(s => s.workoutId === workout.id),
        [data.workoutSets, workout.id]
    )

    /** Exercises in this session, in the order they were first added. */
    const exercises = useMemo(() => {
        const order: string[] = []
        for (const set of sets) {
            if (!order.includes(set.exerciseId)) order.push(set.exerciseId)
        }

        return order
            .map(id => data.exercises.find(e => e.id === id))
            .filter((e): e is Exercise => e !== undefined)
            .map(exercise => ({
                exercise,
                sets: sets
                    .filter(s => s.exerciseId === exercise.id)
                    .sort((a, b) => a.setNumber - b.setNumber),
                previous: previousPerformance(data.workouts, data.workoutSets, exercise.id, workout.id),
            }))
    }, [sets, data.exercises, data.workouts, data.workoutSets, workout.id])

    const volume = workoutVolume(sets.filter(s => s.completedAt !== null))
    const completedSets = sets.filter(s => s.completedAt !== null).length

    const addSet = useCallback(
        (exerciseId: string, existing: WorkoutSet[]) => {
            const last = existing[existing.length - 1]
            const stamp = new Date().toISOString()

            create('workoutSets', {
                id: createId('set'),
                createdAt: stamp,
                updatedAt: stamp,
                workoutId: workout.id,
                exerciseId,
                setNumber: existing.length + 1,
                // Carry the previous set's load forward — you almost always repeat
                // it, and retyping the same numbers five times is the fastest way
                // to make someone stop logging.
                weight: last?.weight ?? null,
                reps: last?.reps ?? null,
                durationSeconds: null,
                completedAt: null,
            })
        },
        [create, workout.id]
    )

    const addExercise = useCallback(
        (exerciseId: string) => {
            addSet(exerciseId, [])
            setPicking(false)
        },
        [addSet]
    )

    const deleteSet = useCallback(
        (setId: string) => {
            replace('workoutSets', data.workoutSets.filter(s => s.id !== setId))
        },
        [data.workoutSets, replace]
    )

    const unused = useMemo(
        () =>
            data.exercises
                .filter(e => e.archivedAt === null && !exercises.some(x => x.exercise.id === e.id))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [data.exercises, exercises]
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Session header — sticky so the clock and Finish stay reachable
                while scrolling a long session on a phone. */}
            <div className={cn('sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-background/95 px-1 py-3 backdrop-blur')}>
                <div className="flex min-w-0 items-baseline gap-3">
                    <span className={cn('text-[22px] font-semibold tracking-[-0.02em]', NUM, INK.strong)}>
                        {elapsed}
                    </span>
                    <span className={cn('truncate', T.body, INK.muted)}>{workout.name}</span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={onDiscard}
                        className={cn('px-2.5 py-1.5', R.md, T.button, INK.muted,
                            'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={onFinish}
                        disabled={completedSets === 0}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5', R.md, T.button,
                            'bg-foreground text-background transition-opacity hover:opacity-90',
                            'disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                    >
                        <Check className="h-3.5 w-3.5" />
                        Finish
                    </button>
                </div>
            </div>

            <div className={cn('flex flex-wrap gap-x-5 gap-y-1 text-[12px]', NUM, INK.muted)}>
                <span>{completedSets} {completedSets === 1 ? 'set' : 'sets'}</span>
                <span>{exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}</span>
                {volume > 0 && <span>{Math.round(volume).toLocaleString()} kg volume</span>}
            </div>

            {exercises.map(({ exercise, sets: exerciseSets, previous }) => {
                const best = bestOneRepMax(exerciseSets.filter(s => s.completedAt !== null), exercise.id)
                const previousBest = previous ? estimatedOneRepMax(previous.weight, previous.reps) : null
                const isPR = best !== null && previousBest !== null && best > previousBest

                return (
                    <Panel key={exercise.id} padded={false}>
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className={cn('truncate', T.title, INK.strong)}>{exercise.name}</span>
                                {isPR && <StatusBadge tone="success">PR</StatusBadge>}
                            </div>
                            <span className={cn(META.wide, 'text-[11px]', NUM, INK.subtle)}>
                                {previous
                                    ? `Last: ${previous.weight}kg × ${previous.reps}`
                                    : 'First time'}
                            </span>
                        </div>

                        {/* Column headers, so the four numeric fields are unambiguous. */}
                        <div className="grid grid-cols-[24px_1fr_1fr_1fr_64px] gap-2 px-1 pb-1 sm:px-2">
                            <span className={cn(LABEL, 'text-center')}>#</span>
                            <span className={cn(LABEL, 'truncate')}>Prev</span>
                            <span className={cn(LABEL, 'text-center')}>Kg</span>
                            <span className={cn(LABEL, 'text-center')}>Reps</span>
                            <span />
                        </div>

                        <div className="flex flex-col px-2 pb-2">
                            {exerciseSets.map((set, index) => (
                                <SetRow
                                    key={set.id}
                                    set={set}
                                    index={index}
                                    previous={previous ? `${previous.weight}×${previous.reps}` : '—'}
                                    onChange={patch => update('workoutSets', set.id, patch)}
                                    onComplete={() =>
                                        update('workoutSets', set.id, {
                                            completedAt: set.completedAt ? null : new Date().toISOString(),
                                        })
                                    }
                                    onDelete={() => deleteSet(set.id)}
                                />
                            ))}

                            <button
                                type="button"
                                onClick={() => addSet(exercise.id, exerciseSets)}
                                className={cn('mt-1 flex items-center gap-2 px-2 py-2', R.md, T.body,
                                    INK.subtle, HOVER, FOCUS, 'transition-colors hover:text-foreground')}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add set
                            </button>
                        </div>
                    </Panel>
                )
            })}

            {/* Add exercise */}
            {picking ? (
                <Panel className="flex flex-col gap-1">
                    <div className="mb-1 flex items-center justify-between">
                        <span className={LABEL}>Add exercise</span>
                        <button
                            type="button"
                            onClick={() => setPicking(false)}
                            aria-label="Cancel"
                            className={cn('flex h-6 w-6 items-center justify-center', R.sm, INK.muted,
                                'hover:bg-foreground/[0.06]', FOCUS)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto">
                        {unused.map(exercise => (
                            <button
                                key={exercise.id}
                                type="button"
                                onClick={() => addExercise(exercise.id)}
                                className={cn(ROW, FOCUS, 'w-full justify-between text-left')}
                            >
                                <span className={cn(T.body, INK.default)}>{exercise.name}</span>
                                <span className={cn(META.wide, 'text-[11px] capitalize', INK.subtle)}>
                                    {exercise.muscleGroup.replace('_', ' ')}
                                </span>
                            </button>
                        ))}
                    </div>
                </Panel>
            ) : (
                <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className={cn('flex items-center justify-center gap-2 border border-dashed px-4 py-3',
                        R.lg, T.body, INK.muted, HAIRLINE,
                        'transition-colors hover:bg-foreground/[0.03] hover:text-foreground', FOCUS)}
                >
                    <Plus className="h-4 w-4" />
                    Add exercise
                </button>
            )}
        </div>
    )
}
