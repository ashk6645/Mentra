'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronRight, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Metric, MetricRow, Panel, SectionHeader, StatusBadge, ProgressBar, Ring } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey, toDateKey, fromDateKey, longDateLabel, weekDays } from '@/lib/second-brain/date'
import {
    dueForReview, studyMinutesInRange, studyMinutesFor, nextReviewInterval, studyByDay,
} from '@/lib/second-brain/domain/selectors'
import type { LearningStatus } from '@/lib/second-brain/domain/types'
import { FOCUS, HAIRLINE, HOVER, INK, LABEL, META, NUM, R, T } from '@/lib/second-brain/ui'

const STATUS_LABEL: Record<LearningStatus, string> = {
    not_started: 'Not started',
    learning: 'Learning',
    practicing: 'Practicing',
    reviewing: 'Reviewing',
    mastered: 'Mastered',
}

/* Same rule as goals and the library — colour marks exceptions, not the norm. */
const STATUS_TONE: Record<LearningStatus, 'neutral' | 'warning' | 'success'> = {
    not_started: 'neutral',
    learning: 'neutral',
    practicing: 'neutral',
    reviewing: 'warning',
    mastered: 'success',
}

const STATUS_ORDER: LearningStatus[] = ['not_started', 'learning', 'practicing', 'reviewing', 'mastered']

/** Minutes as "1h 15m" — raw minute counts stop being readable past an hour. */
function formatMinutes(total: number): string {
    if (total < 60) return `${total}m`
    const h = Math.floor(total / 60)
    const m = total % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/**
 * Study-minutes bar chart.
 *
 * Hand-rolled for the same reason as the fitness sparkline: no charting library
 * exists here and one line of SVG beats a dependency. Bars rather than a line
 * because the value is a discrete daily total, not a continuous series.
 */
function StudyBars({ data }: { data: { date: string; minutes: number }[] }) {
    const max = Math.max(60, ...data.map(d => d.minutes))

    return (
        <div className="flex h-16 items-end gap-1" role="img" aria-label="Study minutes over the last two weeks">
            {data.map(({ date, minutes }) => (
                <div key={date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                        className={cn(
                            'w-full rounded-[2px] transition-all',
                            minutes > 0 ? 'bg-foreground/45' : 'bg-foreground/[0.07]'
                        )}
                        // Floor at 2px so a zero day still reads as a day rather
                        // than a gap in the axis.
                        style={{ height: `${Math.max(2, (minutes / max) * 56)}px` }}
                        title={`${longDateLabel(date)} — ${minutes}m`}
                    />
                </div>
            ))}
        </div>
    )
}

export function LearningView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, update } = useSecondBrainActions()

    const [expanded, setExpanded] = useState<string | null>(null)
    const [draft, setDraft] = useState({ minutes: '', summary: '' })

    const today = todayKey()

    const fortnight = useMemo(() => {
        const days: string[] = []
        for (let i = 13; i >= 0; i--) {
            const d = fromDateKey(today)
            d.setDate(d.getDate() - i)
            days.push(toDateKey(d))
        }
        return days
    }, [today])

    const items = useMemo(
        () =>
            data.learningItems
                .filter(item => item.archivedAt === null)
                .map(item => ({
                    item,
                    minutes: studyMinutesFor(data.studySessions, item.id),
                    sessions: data.studySessions
                        .filter(s => s.learningItemId === item.id)
                        .sort((a, b) => b.date.localeCompare(a.date)),
                    goal: data.goals.find(g => g.id === item.goalId) ?? null,
                }))
                .sort((a, b) =>
                    STATUS_ORDER.indexOf(a.item.status) - STATUS_ORDER.indexOf(b.item.status) ||
                    b.minutes - a.minutes
                ),
        [data.learningItems, data.studySessions, data.goals]
    )

    const due = useMemo(
        () => dueForReview(data.learningItems.filter(i => i.archivedAt === null), today),
        [data.learningItems, today]
    )

    const week = useMemo(() => weekDays(new Date()), [])
    const weekMinutes = studyMinutesInRange(data.studySessions, week)
    const totalMinutes = data.studySessions.reduce((sum, s) => sum + s.minutes, 0)
    const chart = useMemo(() => studyByDay(data.studySessions, fortnight), [data.studySessions, fortnight])

    const logSession = useCallback(
        (learningItemId: string) => {
            const minutes = Number(draft.minutes)
            if (!minutes || minutes <= 0) return

            const stamp = new Date().toISOString()
            create('studySessions', {
                id: createId('study'),
                createdAt: stamp,
                updatedAt: stamp,
                learningItemId,
                date: today,
                minutes,
                summary: draft.summary.trim(),
                confidence: 3,
            })
            setDraft({ minutes: '', summary: '' })
        },
        [create, draft, today]
    )

    /**
     * Record a review and schedule the next one.
     *
     * Confidence drives the interval, so a topic you rated poorly comes back
     * tomorrow while one you're solid on recedes — the useful half of spaced
     * repetition without pretending to a real algorithm.
     */
    const review = useCallback(
        (id: string, confidence: number, reviewCount: number) => {
            const next = fromDateKey(today)
            next.setDate(next.getDate() + nextReviewInterval(confidence, reviewCount))

            update('learningItems', id, {
                confidence,
                lastReviewedAt: today,
                nextReviewAt: toDateKey(next),
                reviewCount: reviewCount + 1,
            })
        },
        [today, update]
    )

    const addItem = useCallback(() => {
        const stamp = new Date().toISOString()
        const item = {
            id: createId('learn'),
            createdAt: stamp,
            updatedAt: stamp,
            archivedAt: null,
            title: 'New topic',
            category: 'General',
            status: 'not_started' as const,
            areaId: null,
            goalId: null,
            progress: 0,
            confidence: 1,
            lastReviewedAt: null,
            nextReviewAt: null,
            reviewCount: 0,
        }
        create('learningItems', item)
        setExpanded(item.id)
    }, [create])

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
                <div className="h-[240px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <MetricRow>
                <Metric
                    value={formatMinutes(weekMinutes)}
                    label="Studied this week"
                    animate={false}
                    leading={<Ring percent={Math.min(100, (weekMinutes / 300) * 100)} />}
                />
                <Metric value={formatMinutes(totalMinutes)} label="All time" animate={false} />
                <Metric value={due.length} label={due.length === 1 ? 'Topic due for review' : 'Topics due for review'} />
            </MetricRow>

            {/* Review queue — the reason to open this page daily. */}
            {due.length > 0 && (
                <section>
                    <SectionHeader title="Due for review" count={due.length} />
                    <div className="flex flex-col gap-2">
                        {due.map(item => (
                            <Panel key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className={cn('truncate', T.body, INK.strong)}>{item.title}</span>
                                    <span className={cn('text-[11px]', INK.subtle)}>
                                        {item.lastReviewedAt
                                            ? `Last reviewed ${longDateLabel(item.lastReviewedAt).split(',')[1]?.trim()}`
                                            : 'Never reviewed'}
                                        {' · '}
                                        {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
                                    </span>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <span className={LABEL}>How solid?</span>
                                    {/*
                                      * A joined track, matching the mood and day-rating
                                      * scales on Today. Outlining each of the five cells
                                      * made this read as a form to fill in rather than a
                                      * control to set, and put five more boxes on a page
                                      * that had just had its boxes removed.
                                      */}
                                    <span className="flex gap-px">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => review(item.id, n, item.reviewCount)}
                                            aria-label={`Rate ${item.title} ${n} of 5`}
                                            className={cn('h-7 w-[26px] text-[11px] font-medium', NUM, FOCUS,
                                                'first:rounded-l-[6px] last:rounded-r-[6px]',
                                                'bg-foreground/[0.05]', INK.subtle,
                                                'transition-colors hover:bg-foreground/[0.09] hover:text-foreground')}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    </span>
                                </div>
                            </Panel>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
                {/* Topics */}
                <section>
                    <SectionHeader
                        title="Topics"
                        count={items.length}
                        action={
                            <button
                                type="button"
                                onClick={addItem}
                                className={cn('flex items-center gap-1 px-1.5 py-1', R.sm, T.label, INK.muted,
                                    'transition-colors hover:text-foreground', FOCUS)}
                            >
                                <Plus className="h-3 w-3" />
                                New
                            </button>
                        }
                    />

                    {items.length === 0 ? (
                        <Panel className="py-12 text-center">
                            <p className={cn(T.body, INK.muted)}>Nothing being learned yet.</p>
                            <p className={cn('mt-1.5', T.label, INK.subtle)}>
                                A topic is something you are deliberately getting better at.
                            </p>
                        </Panel>
                    ) : (
                        // No gap — each topic carries its own rule, matching Goals.
                        <div className="flex flex-col">
                            {items.map(({ item, minutes, sessions, goal }) => {
                                const isOpen = expanded === item.id

                                return (
                                    /* A ruled row, not a card — see the same change in Goals. */
                                    <div key={item.id} className={cn('border-b last:border-b-0', HAIRLINE)}>
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(isOpen ? null : item.id)}
                                            aria-expanded={isOpen}
                                            className={cn('flex w-full flex-col gap-3 px-2 py-3.5 text-left',
                                                R.md, HOVER, FOCUS, 'transition-colors')}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform',
                                                        INK.subtle, isOpen && 'rotate-90')} />
                                                    <span className={cn('truncate', T.title, INK.strong)}>{item.title}</span>
                                                </div>
                                                {/* Fixed column: the tinted badge is wider than
                                                    plain text, so without it the statuses ended
                                                    a few pixels apart down the list. */}
                                                <span className={cn(META.wide, 'flex justify-end')}>
                                                    <StatusBadge tone={STATUS_TONE[item.status]}>
                                                        {STATUS_LABEL[item.status]}
                                                    </StatusBadge>
                                                </span>
                                            </div>

                                            <ProgressBar percent={item.progress} complete={item.status === 'mastered'} />

                                            <div className={cn('flex flex-wrap gap-x-4 gap-y-1 text-[11px]', NUM, INK.muted)}>
                                                <span>{item.category}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatMinutes(minutes)}
                                                </span>
                                                <span>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>
                                                {goal && <span className="truncate">→ {goal.title}</span>}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="flex flex-col gap-6 px-2 pb-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className={LABEL}>Status</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {STATUS_ORDER.map(status => (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                onClick={() => update('learningItems', item.id, { status })}
                                                                aria-pressed={item.status === status}
                                                                className={cn('px-2 py-1 text-[11.5px] font-medium', R.sm, FOCUS,
                                                                    item.status === status
                                                                        ? 'bg-foreground text-background'
                                                                        : cn('border', HAIRLINE, INK.muted, 'hover:bg-foreground/[0.05]'))}
                                                            >
                                                                {STATUS_LABEL[status]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={LABEL}>Progress</span>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={5}
                                                        value={item.progress}
                                                        onChange={e => update('learningItems', item.id, { progress: Number(e.target.value) })}
                                                        aria-label={`${item.title} progress`}
                                                        className="flex-1 accent-foreground"
                                                    />
                                                    <span className={cn('w-9 text-right text-[11px]', NUM, INK.muted)}>
                                                        {item.progress}%
                                                    </span>
                                                </div>

                                                {/* Log a session */}
                                                <div className="flex flex-col gap-2">
                                                    <span className={LABEL}>Log a session</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        <input
                                                            value={draft.minutes}
                                                            onChange={e => setDraft(d => ({ ...d, minutes: e.target.value.replace(/\D/g, '') }))}
                                                            inputMode="numeric"
                                                            placeholder="min"
                                                            aria-label="Minutes studied"
                                                            className={cn('w-20 border bg-transparent px-2.5 py-2 text-center',
                                                                R.md, T.body, NUM, HAIRLINE,
                                                                'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                                        />
                                                        <input
                                                            value={draft.summary}
                                                            onChange={e => setDraft(d => ({ ...d, summary: e.target.value }))}
                                                            onKeyDown={e => e.key === 'Enter' && logSession(item.id)}
                                                            placeholder="What did you cover?"
                                                            className={cn('min-w-0 flex-1 border bg-transparent px-2.5 py-2',
                                                                R.md, T.body, HAIRLINE,
                                                                'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => logSession(item.id)}
                                                            disabled={!draft.minutes}
                                                            className={cn('px-3 py-2', R.md, T.button,
                                                                'bg-foreground text-background transition-opacity hover:opacity-90',
                                                                'disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                                                        >
                                                            Log
                                                        </button>
                                                    </div>
                                                </div>

                                                {sessions.length > 0 && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className={LABEL}>Recent sessions</span>
                                                        {sessions.slice(0, 4).map(session => (
                                                            <div key={session.id} className="flex items-baseline gap-3">
                                                                <span className={cn('w-14 shrink-0 text-[11px]', NUM, INK.subtle)}>
                                                                    {formatMinutes(session.minutes)}
                                                                </span>
                                                                <span className={cn('flex-1 text-[12px]', INK.muted)}>
                                                                    {session.summary || 'No notes'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                {/* Study time */}
                <section>
                    <SectionHeader title="Last two weeks" />
                    <Panel className="flex flex-col gap-3">
                        <StudyBars data={chart} />
                        <div className={cn('flex justify-between text-[10px]', INK.subtle)}>
                            <span>{longDateLabel(fortnight[0]).split(',')[1]?.trim()}</span>
                            <span>Today</span>
                        </div>
                    </Panel>
                </section>
            </div>
        </div>
    )
}
