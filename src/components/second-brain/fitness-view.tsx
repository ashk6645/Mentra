'use client'

import { useCallback, useMemo, useState } from 'react'
import { Dumbbell, Play, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActiveWorkout } from './active-workout'
import { useConfirm } from './confirm-dialog'
import { notify, notifyWithUndo } from '@/lib/second-brain/feedback'
import { Metric, MetricRow, SectionHeader, StatusBadge, Ring } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey, toDateKey, longDateLabel } from '@/lib/second-brain/date'
import {
    activeWorkout, fitnessSummary, workoutVolume, workoutDurationMinutes,
    exerciseProgression, bestOneRepMax, previousPerformance,
} from '@/lib/second-brain/domain/selectors'
import type { Workout } from '@/lib/second-brain/domain/types'
import { R, T, INK, NUM, FOCUS, HOVER, HAIRLINE } from '@/lib/second-brain/ui'

/**
 * Progression sparkline.
 *
 * Hand-rolled SVG rather than adding a charting dependency: the project has none,
 * and pulling one in for a single 90px line would be the largest addition in the
 * feature (spec §59). Points are normalised to the series' own range so a plateau
 * still reads as a plateau rather than being stretched to fill the box.
 */
function Sparkline({ points }: { points: { date: string; oneRepMax: number }[] }) {
    if (points.length < 2) return null

    const values = points.map(p => p.oneRepMax)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const W = 96
    const H = 28

    const path = points
        .map((point, i) => {
            const x = (i / (points.length - 1)) * W
            const y = H - ((point.oneRepMax - min) / range) * H
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')

    const improving = values[values.length - 1] >= values[0]

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-7 w-24 overflow-visible"
            role="img"
            aria-label={`Estimated one-rep max trend: ${Math.round(min)} to ${Math.round(max)} kg`}
        >
            <path
                d={path}
                fill="none"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={improving ? 'stroke-emerald-500' : 'stroke-foreground/40'}
            />
        </svg>
    )
}

/** One finished session in the history list. */
function WorkoutRow({
    workout,
    volume,
    setCount,
}: {
    workout: Workout
    volume: number
    setCount: number
}) {
    const minutes = workoutDurationMinutes(workout)

    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 px-2 py-2.5', R.md, HOVER)}>
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className={cn('truncate', T.body, INK.strong)}>{workout.name}</span>
                <span className={cn('text-[11px]', INK.subtle)}>
                    {longDateLabel(toDateKey(new Date(workout.startedAt)))}
                </span>
            </div>

            <div className={cn('flex shrink-0 gap-4 text-[11px]', NUM, INK.muted)}>
                {minutes !== null && <span>{minutes}m</span>}
                <span>{setCount} sets</span>
                <span>{Math.round(volume).toLocaleString()} kg</span>
            </div>
        </div>
    )
}

export function FitnessView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, update, replace } = useSecondBrainActions()

    const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
    const { confirm, dialog } = useConfirm()

    const today = todayKey()
    const open = useMemo(() => activeWorkout(data.workouts), [data.workouts])
    const summary = useMemo(
        () => fitnessSummary(data.workouts, data.workoutSets, today),
        [data.workouts, data.workoutSets, today]
    )

    const history = useMemo(
        () =>
            data.workouts
                .filter(w => w.finishedAt !== null)
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .slice(0, 8)
                .map(workout => {
                    const sets = data.workoutSets.filter(s => s.workoutId === workout.id)
                    return { workout, volume: workoutVolume(sets), setCount: sets.length }
                }),
        [data.workouts, data.workoutSets]
    )

    const templates = useMemo(
        () =>
            data.workoutTemplates
                .filter(t => t.archivedAt === null)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(template => ({
                    template,
                    exercises: data.templateExercises
                        .filter(te => te.templateId === template.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder),
                })),
        [data.workoutTemplates, data.templateExercises]
    )

    /** Exercises that have been performed, with their progression. */
    const library = useMemo(
        () =>
            data.exercises
                .filter(e => e.archivedAt === null)
                .map(exercise => ({
                    exercise,
                    progression: exerciseProgression(data.workouts, data.workoutSets, exercise.id),
                    best: bestOneRepMax(data.workoutSets, exercise.id),
                    last: previousPerformance(data.workouts, data.workoutSets, exercise.id),
                }))
                // Performed exercises first — an untouched library entry is
                // reference material, not something you're tracking.
                .sort((a, b) => b.progression.length - a.progression.length || a.exercise.name.localeCompare(b.exercise.name)),
        [data.exercises, data.workouts, data.workoutSets]
    )

    const startWorkout = useCallback(
        (templateId: string | null, name: string) => {
            const stamp = new Date().toISOString()
            const workoutId = createId('workout')

            create('workouts', {
                id: workoutId,
                createdAt: stamp,
                updatedAt: stamp,
                templateId,
                name,
                startedAt: stamp,
                finishedAt: null,
                notes: '',
                rating: null,
            })

            // Pre-fill the template's exercises with their first set, so the
            // session opens ready to log rather than empty.
            if (templateId) {
                const planned = data.templateExercises
                    .filter(te => te.templateId === templateId)
                    .sort((a, b) => a.sortOrder - b.sortOrder)

                for (const item of planned) {
                    const last = previousPerformance(data.workouts, data.workoutSets, item.exerciseId)
                    create('workoutSets', {
                        id: createId('set'),
                        createdAt: stamp,
                        updatedAt: stamp,
                        workoutId,
                        exerciseId: item.exerciseId,
                        setNumber: 1,
                        weight: last?.weight ?? null,
                        reps: last?.reps ?? null,
                        durationSeconds: null,
                        completedAt: null,
                    })
                }
            }
        },
        [create, data.templateExercises, data.workouts, data.workoutSets]
    )

    const finishWorkout = useCallback(() => {
        if (!open) return

        // Drop sets that were never completed — an untouched pre-filled row
        // shouldn't count toward volume or appear in history as work done.
        replace(
            'workoutSets',
            data.workoutSets.filter(s => s.workoutId !== open.id || s.completedAt !== null)
        )
        update('workouts', open.id, { finishedAt: new Date().toISOString() })
    }, [open, data.workoutSets, replace, update])

    const discardWorkout = useCallback(async () => {
        if (!open) return

        const confirmed = await confirm({
            title: 'Discard this workout?',
            description: 'Every set logged in it goes with it.',
            confirmLabel: 'Discard',
            destructive: true,
        })
        if (!confirmed) return

        const sets = data.workoutSets
        const workouts = data.workouts

        replace('workoutSets', sets.filter(s => s.workoutId !== open.id))
        replace('workouts', workouts.filter(w => w.id !== open.id))

        notifyWithUndo('Workout discarded.', () => {
            replace('workoutSets', sets)
            replace('workouts', workouts)
        })
    }, [open, data.workouts, data.workoutSets, replace, confirm])

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                <div className="h-[200px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    // A session in progress takes over the page — anything else is a distraction
    // while you're standing at a rack.
    if (open) {
        // The dialog has to mount in this branch too — discarding is only
        // reachable from here, and a dialog rendered in the other return would
        // never be in the tree when it is asked to open.
        return (
            <>
                {dialog}
                <ActiveWorkout workout={open} onFinish={finishWorkout} onDiscard={discardWorkout} />
            </>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <MetricRow>
                <Metric
                    value={summary.thisWeek}
                    label="Sessions this week"
                    leading={<Ring percent={Math.min(100, (summary.thisWeek / 5) * 100)} />}
                />
                <Metric value={summary.weekStreak} label={summary.weekStreak === 1 ? 'Week streak' : 'Week streak'} />
                <Metric
                    value={Math.round(summary.totalVolume / 1000)}
                    suffix="k"
                    label="Volume, last 30 days (kg)"
                />
            </MetricRow>

            {/* Start */}
            <section>
                <SectionHeader title="Start a session" count={templates.length} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {templates.map(({ template, exercises }) => (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => startWorkout(template.id, template.name)}
                            className={cn('flex flex-col gap-2 border p-4 text-left', R.lg, HAIRLINE,
                                'transition-colors hover:bg-foreground/[0.03]', FOCUS)}
                        >
                            <div className="flex items-center gap-2">
                                <Dumbbell className="h-4 w-4 shrink-0 text-foreground/60" strokeWidth={1.75} />
                                <span className={cn('flex-1', T.title, INK.strong)}>
                                    {template.name.split('—')[0].trim()}
                                </span>
                            </div>
                            <span className={cn('text-[11px]', INK.subtle)}>
                                {exercises.length} exercises · {template.program}
                            </span>
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => startWorkout(null, 'Freestyle session')}
                        className={cn('flex flex-col items-start justify-center gap-2 border border-dashed p-4 text-left',
                            R.lg, HAIRLINE, 'transition-colors hover:bg-foreground/[0.03]', FOCUS)}
                    >
                        <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 shrink-0 text-foreground/60" strokeWidth={1.75} />
                            <span className={cn(T.title, INK.default)}>Empty session</span>
                        </div>
                        <span className={cn('text-[11px]', INK.subtle)}>Pick exercises as you go</span>
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
                {/* History */}
                <section>
                    <SectionHeader title="Recent sessions" count={history.length} />
                    {history.length === 0 ? (
                        <p className={cn('px-2 py-6', T.body, INK.subtle)}>No sessions logged yet.</p>
                    ) : (
                        <div className="flex flex-col">
                            {history.map(({ workout, volume, setCount }) => (
                                <WorkoutRow key={workout.id} workout={workout} volume={volume} setCount={setCount} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Exercise library with progression */}
                <section>
                    <SectionHeader title="Exercises" count={library.length} />
                    <div className="flex flex-col">
                        {library.map(({ exercise, progression, best, last }) => {
                            const isOpen = expandedExercise === exercise.id
                            const first = progression[0]?.oneRepMax
                            const latest = progression[progression.length - 1]?.oneRepMax
                            const gained = first !== undefined && latest !== undefined ? latest - first : null

                            return (
                                <div key={exercise.id}>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedExercise(isOpen ? null : exercise.id)}
                                        aria-expanded={isOpen}
                                        className={cn('flex w-full items-center gap-3 px-2 py-2.5 text-left',
                                            R.md, HOVER, FOCUS, 'transition-colors')}
                                    >
                                        <span className={cn('flex-1 truncate', T.body,
                                            progression.length > 0 ? INK.strong : INK.subtle)}>
                                            {exercise.name}
                                        </span>

                                        <Sparkline points={progression} />

                                        <span className={cn('w-14 shrink-0 text-right text-[11px]', NUM,
                                            best !== null ? INK.muted : INK.subtle)}>
                                            {best !== null ? `${best} kg` : '—'}
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className={cn('mb-2 ml-2 flex flex-col gap-3 border-l pl-4', HAIRLINE)}>
                                            <div className={cn('flex flex-wrap gap-x-5 gap-y-1 pt-2 text-[11px]', NUM, INK.muted)}>
                                                <span className="capitalize">{exercise.muscleGroup.replace('_', ' ')}</span>
                                                <span>{exercise.equipment}</span>
                                                <span>{progression.length} sessions</span>
                                                {gained !== null && gained !== 0 && (
                                                    <StatusBadge tone={gained > 0 ? 'success' : 'neutral'}>
                                                        <TrendingUp className="h-2.5 w-2.5" />
                                                        {gained > 0 ? '+' : ''}{Math.round(gained * 10) / 10} kg
                                                    </StatusBadge>
                                                )}
                                            </div>

                                            {last && (
                                                <span className={cn('text-[11px]', NUM, INK.subtle)}>
                                                    Last: {last.weight}kg × {last.reps} on {longDateLabel(last.date).split(',')[1]?.trim()}
                                                </span>
                                            )}

                                            {progression.length === 0 && (
                                                <span className={cn('pb-2 text-[11px]', INK.subtle)}>
                                                    Not performed yet.
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    )
}
