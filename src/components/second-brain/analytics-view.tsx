'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Segmented } from './segmented'
import { HabitIcon } from '@/lib/second-brain/icons'
import { Metric, MetricRow, Panel, SectionHeader, ProgressBar, Ring } from './primitives'
import { useSecondBrainData, useStoreReady } from '@/lib/second-brain/repo'
import { todayKey, toDateKey, fromDateKey, longDateLabel } from '@/lib/second-brain/date'
import {
    periodSummary, buildEntryIndex, lookupFrom, habitCompletion, isScheduledOn,
    isWeeklyCount,
} from '@/lib/second-brain/domain/selectors'
import { R, T, INK, NUM, HAIRLINE } from '@/lib/second-brain/ui'

type Range = '7' | '30' | '90'

const RANGES = [
    { id: '7' as const, label: '7 days' },
    { id: '30' as const, label: '30 days' },
    { id: '90' as const, label: '90 days' },
]

/**
 * Weekly buckets across a range.
 *
 * Daily bars over 90 days are unreadable noise; weekly buckets show the trend the
 * user is actually asking about ("am I becoming more consistent?") at every range.
 */
function bucketByWeek(days: string[], valueFor: (day: string) => { done: number; total: number }) {
    const buckets: { label: string; done: number; total: number }[] = []

    for (let i = 0; i < days.length; i += 7) {
        const chunk = days.slice(i, i + 7)
        const totals = chunk.reduce(
            (acc, day) => {
                const v = valueFor(day)
                return { done: acc.done + v.done, total: acc.total + v.total }
            },
            { done: 0, total: 0 }
        )
        buckets.push({ label: chunk[0], ...totals })
    }

    return buckets
}

/** Vertical bars with a percentage each. One question per chart (spec §28). */
function TrendBars({
    buckets,
    label,
}: {
    buckets: { label: string; done: number; total: number }[]
    label: string
}) {
    /*
     * Bar heights are pixels, not percentages.
     *
     * A percentage height only resolves against a parent with a definite height,
     * and a flex item's height is computed by the layout rather than declared —
     * so `height: 80%` inside one collapses to nothing. This rendered as labels
     * with no bars at all.
     */
    const TRACK = 80

    return (
        /*
         * Bars are capped and left-aligned rather than stretched to fill.
         * Five buckets across a half-width panel gave each bar ~85px, which reads
         * as a row of coloured blocks rather than a chart — the width carried no
         * information, since only height is meaningful here.
         */
        <div className="flex items-end gap-2" role="img" aria-label={label}>
            {buckets.map(bucket => {
                const percent = bucket.total === 0 ? 0 : Math.round((bucket.done / bucket.total) * 100)

                return (
                    <div key={bucket.label} className="flex w-full max-w-[40px] flex-col items-center gap-1.5">
                        <div className="flex w-full items-end" style={{ height: TRACK }}>
                            <div
                                className={cn(
                                    'w-full rounded-[3px] transition-all',
                                    bucket.total === 0
                                        ? 'bg-foreground/[0.06]'
                                        : percent >= 80
                                            ? 'bg-emerald-500/80'
                                            : 'bg-foreground/40'
                                )}
                                // Floor at 3px so an empty week still reads as a
                                // week rather than a gap in the axis.
                                style={{ height: Math.max(3, (Math.min(100, percent) / 100) * TRACK) }}
                                title={`Week of ${longDateLabel(bucket.label)} — ${percent}%`}
                            />
                        </div>
                        <span className={cn('text-[9px]', NUM, INK.subtle)}>
                            {bucket.total === 0 ? '—' : percent}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

/**
 * The life dashboard.
 *
 * Spec §28 is explicit that every chart must answer a question, so there are
 * four, each labelled with the question it answers. Anything that would merely
 * look analytical was left out.
 */
export function AnalyticsView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const [range, setRange] = useState<Range>('30')

    const today = todayKey()

    const days = useMemo(() => {
        const count = Number(range)
        const result: string[] = []
        for (let i = count - 1; i >= 0; i--) {
            const d = fromDateKey(today)
            d.setDate(d.getDate() - i)
            result.push(toDateKey(d))
        }
        return result
    }, [range, today])

    const summary = useMemo(() => periodSummary(data, days, today), [data, days, today])

    const isDone = useMemo(
        () => lookupFrom(buildEntryIndex(data.habitEntries)),
        [data.habitEntries]
    )

    const activeHabits = useMemo(
        () => data.habits.filter(h => h.archivedAt === null),
        [data.habits]
    )

    /** "Am I becoming more consistent?" — habit completion, week by week. */
    const consistency = useMemo(
        () =>
            bucketByWeek(days, day => {
                const due = activeHabits.filter(h => isScheduledOn(h, day))
                const bonus = activeHabits.filter(h => isWeeklyCount(h) && isDone(h.id, day))
                return {
                    done: due.filter(h => isDone(h.id, day)).length + bonus.length,
                    total: day > today ? 0 : due.length + bonus.length,
                }
            }),
        [days, activeHabits, isDone, today]
    )

    /** "Am I training regularly?" — sessions per week against a target of 4. */
    const training = useMemo(() => {
        const byDay = new Map<string, number>()
        for (const workout of data.workouts) {
            if (workout.finishedAt === null) continue
            const key = toDateKey(new Date(workout.startedAt))
            byDay.set(key, (byDay.get(key) ?? 0) + 1)
        }
        return bucketByWeek(days, day => ({ done: byDay.get(day) ?? 0, total: day > today ? 0 : 4 / 7 }))
    }, [days, data.workouts, today])

    /** "Which habits am I struggling with?" — worst first. */
    const struggling = useMemo(
        () =>
            activeHabits
                .map(habit => ({ habit, completion: habitCompletion(habit, isDone, days, today) }))
                .filter(h => h.completion.expected > 0)
                .sort((a, b) => a.completion.percent - b.completion.percent),
        [activeHabits, isDone, days, today]
    )

    /** "Where did my time go?" — the only two time sources this store owns. */
    const timeSplit = useMemo(() => {
        const studyMinutes = summary.studyMinutes
        const trainingMinutes = summary.workoutMinutes
        const total = studyMinutes + trainingMinutes

        return { studyMinutes, trainingMinutes, total }
    }, [summary])

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                <div className="h-[280px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    const formatMinutes = (m: number) => (m < 60 ? `${m}m` : `${Math.round((m / 60) * 10) / 10}h`)

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-end">
                <Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Time range" />
            </div>

            <MetricRow>
                <Metric
                    value={summary.habitCompletion.percent}
                    suffix="%"
                    label="Habit consistency"
                    leading={<Ring percent={summary.habitCompletion.percent} />}
                />
                <Metric value={summary.workouts} label={`Sessions · ${formatMinutes(summary.workoutMinutes)}`} />
                <Metric
                    value={formatMinutes(summary.studyMinutes)}
                    label={`Studied · ${summary.studySessions} sessions`}
                    animate={false}
                />
            </MetricRow>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section>
                    <SectionHeader title="Am I becoming more consistent?" />
                    <Panel className="flex flex-col gap-3">
                        <TrendBars buckets={consistency} label="Habit completion per week" />
                        <span className={cn('text-[11px]', INK.subtle)}>
                            Habit completion, week by week. Bars at 80%+ are green.
                        </span>
                    </Panel>
                </section>

                <section>
                    <SectionHeader title="Am I training regularly?" />
                    <Panel className="flex flex-col gap-3">
                        <TrendBars buckets={training} label="Training sessions per week" />
                        <span className={cn('text-[11px]', INK.subtle)}>
                            Sessions per week, against a target of four.
                        </span>
                    </Panel>
                </section>

                <section>
                    <SectionHeader title="Which habits am I struggling with?" />
                    <Panel className="flex flex-col gap-3">
                        {struggling.length === 0 ? (
                            <p className={cn(T.body, INK.subtle)}>Nothing scheduled in this range.</p>
                        ) : (
                            struggling.map(({ habit, completion }) => (
                                <div key={habit.id} className="flex items-center gap-3">
                                    <HabitIcon icon={habit.icon} className="h-[14px] w-[14px] shrink-0 text-foreground/55" />
                                    <span className={cn('w-24 shrink-0 truncate', T.body, INK.default)}>
                                        {habit.name}
                                    </span>
                                    <ProgressBar percent={completion.percent} className="flex-1" />
                                    <span className={cn('w-9 shrink-0 text-right text-[11px]', NUM, INK.muted)}>
                                        {completion.percent}%
                                    </span>
                                </div>
                            ))
                        )}
                    </Panel>
                </section>

                <section>
                    <SectionHeader title="Where did my time go?" />
                    <Panel className="flex flex-col gap-4">
                        {timeSplit.total === 0 ? (
                            <p className={cn(T.body, INK.subtle)}>
                                No tracked time in this range.
                            </p>
                        ) : (
                            <>
                                {/* A stacked bar, not a pie — spec §28 warns against
                                    overusing pie charts, and two segments compare
                                    far more readably side by side. */}
                                <div className={cn('flex h-8 overflow-hidden', R.sm)}>
                                    <div
                                        className="bg-foreground/45"
                                        style={{ width: `${(timeSplit.studyMinutes / timeSplit.total) * 100}%` }}
                                        title={`Study — ${formatMinutes(timeSplit.studyMinutes)}`}
                                    />
                                    <div
                                        className="bg-emerald-500/70"
                                        style={{ width: `${(timeSplit.trainingMinutes / timeSplit.total) * 100}%` }}
                                        title={`Training — ${formatMinutes(timeSplit.trainingMinutes)}`}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <span className={cn('h-2.5 w-2.5 rounded-[3px] bg-foreground/45')} />
                                            <span className={cn(T.body, INK.default)}>Study</span>
                                        </span>
                                        <span className={cn('text-[11px]', NUM, INK.muted)}>
                                            {formatMinutes(timeSplit.studyMinutes)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <span className={cn('h-2.5 w-2.5 rounded-[3px] bg-emerald-500/70')} />
                                            <span className={cn(T.body, INK.default)}>Training</span>
                                        </span>
                                        <span className={cn('text-[11px]', NUM, INK.muted)}>
                                            {formatMinutes(timeSplit.trainingMinutes)}
                                        </span>
                                    </div>
                                </div>

                                {/* Honest about the gap rather than implying this is
                                    the whole picture. */}
                                <p className={cn('border-t pt-3 text-[11px]', HAIRLINE, INK.subtle)}>
                                    Only study and training are timed here. Focus sessions live in Mentra&rsquo;s
                                    own timer and are not counted.
                                </p>
                            </>
                        )}
                    </Panel>
                </section>
            </div>
        </div>
    )
}
