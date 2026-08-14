'use client'

import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from './empty-state'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Segmented } from './segmented'
import { HabitIcon } from '@/lib/second-brain/icons'
import { Metric, MetricRow, Panel, SectionHeader, StatusBadge, ProgressBar, Ring } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey, longDateLabel, weekDays, weekRangeLabel, monthLabel } from '@/lib/second-brain/date'
import { periodSummary, monthRange } from '@/lib/second-brain/domain/selectors'
import type { Review, ReviewKind, JournalEntry } from '@/lib/second-brain/domain/types'
import { FOCUS, HAIRLINE, ICON, INK, LABEL, NUM, R, T } from '@/lib/second-brain/ui'

type Tab = 'journal' | 'weekly' | 'monthly'

const TABS = [
    { id: 'journal' as const, label: 'Journal' },
    { id: 'weekly' as const, label: 'Weekly review' },
    { id: 'monthly' as const, label: 'Monthly review' },
]

function formatMinutes(total: number): string {
    if (total === 0) return '—'
    if (total < 60) return `${total}m`
    const h = Math.floor(total / 60)
    const m = total % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** The reflection prompts, shared by both review kinds. */
const PROMPTS: { field: keyof Review; label: string; placeholder: string }[] = [
    { field: 'wins', label: 'Biggest wins', placeholder: 'What actually moved?' },
    { field: 'worked', label: 'What worked', placeholder: 'Worth repeating deliberately.' },
    { field: 'didntWork', label: "What didn't", placeholder: 'Be specific, not harsh.' },
    { field: 'learned', label: 'What you learned', placeholder: 'About the work, or about yourself.' },
    { field: 'stop', label: 'Stop', placeholder: 'One thing to drop.' },
    { field: 'continueDoing', label: 'Continue', placeholder: 'One thing to protect.' },
    { field: 'start', label: 'Start', placeholder: 'One thing to try.' },
    { field: 'nextPriorities', label: 'Next priorities', placeholder: 'One per line. Three at most.' },
]

function PromptField({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string
    value: string
    placeholder: string
    onChange: (v: string) => void
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{label}</span>
            <textarea
                rows={2}
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className={cn('w-full resize-none border bg-transparent px-2.5 py-2', R.md, T.body, HAIRLINE,
                    'placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40')}
            />
        </label>
    )
}

/**
 * Journal, weekly review and monthly review.
 *
 * All three are the same activity at different resolutions, which is why they
 * share a page rather than three nav entries. The reviews open with the period
 * already summarised — spec §25 is explicit that this should feel like a guided
 * process rather than a wall of empty fields.
 */
export function ReflectView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, update } = useSecondBrainActions()

    const [tab, setTab] = useState<Tab>('journal')
    const [anchor, setAnchor] = useState(() => new Date())

    const today = todayKey()

    const days = useMemo(
        () => (tab === 'monthly' ? monthRange(anchor) : weekDays(anchor)),
        [tab, anchor]
    )

    const summary = useMemo(() => periodSummary(data, days, today), [data, days, today])

    const periodStart = days[0]
    const rangeLabel = tab === 'monthly' ? monthLabel(anchor) : weekRangeLabel(weekDays(anchor))

    const review = useMemo(
        () =>
            data.reviews.find(
                r => r.kind === (tab === 'monthly' ? 'monthly' : 'weekly') && r.periodStart === periodStart
            ) ?? null,
        [data.reviews, tab, periodStart]
    )

    const journal = useMemo(
        () =>
            data.journalEntries
                .filter(e => e.date <= today)
                .sort((a, b) => b.date.localeCompare(a.date)),
        [data.journalEntries, today]
    )

    const step = (delta: number) => {
        const next = new Date(anchor)
        if (tab === 'monthly') {
            next.setDate(1)
            next.setMonth(next.getMonth() + delta)
        } else {
            next.setDate(next.getDate() + delta * 7)
        }
        setAnchor(next)
    }

    /** Write a prompt field, creating the review on first keystroke. */
    const writeReview = useCallback(
        (field: keyof Review, value: string) => {
            const kind: ReviewKind = tab === 'monthly' ? 'monthly' : 'weekly'

            if (review) {
                update('reviews', review.id, { [field]: value } as Partial<Review>)
                return
            }

            const stamp = new Date().toISOString()
            create('reviews', {
                id: createId('review'),
                createdAt: stamp,
                updatedAt: stamp,
                kind,
                periodStart,
                wins: '', worked: '', didntWork: '', learned: '',
                stop: '', continueDoing: '', start: '', nextPriorities: '',
                completedAt: null,
                [field]: value,
            } as Review)
        },
        [create, update, review, tab, periodStart]
    )

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-9 w-72 animate-pulse rounded-[8px] bg-foreground/[0.05]" />
                <div className="h-[320px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented options={TABS} value={tab} onChange={setTab} ariaLabel="Reflection view" />

                {tab !== 'journal' && (
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => step(-1)}
                            aria-label={tab === 'monthly' ? 'Previous month' : 'Previous week'}
                            className={cn('flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                                'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className={cn('min-w-[128px] text-center', T.button, INK.strong)}>{rangeLabel}</span>
                        <button
                            type="button"
                            onClick={() => step(1)}
                            aria-label={tab === 'monthly' ? 'Next month' : 'Next week'}
                            className={cn('flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                                'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Journal */}
            {tab === 'journal' && (
                <section>
                    <SectionHeader title="Entries" count={journal.length} />

                    {journal.length === 0 ? (
                        <EmptyState
                            title="No entries yet"
                            description="Reflection is written on the Today page — this is where it accumulates."
                        />
                    ) : (
                        // No gap — each row carries its own rule and padding.
                        <div className="flex flex-col">
                            {journal.map(entry => (
                                <JournalRow key={entry.id} entry={entry} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Reviews */}
            {tab !== 'journal' && (
                <>
                    {/* The period, summarised. Everything here is derived. */}
                    <MetricRow>
                        <Metric
                            value={summary.habitCompletion.percent}
                            suffix="%"
                            label={`Habits · ${summary.habitCompletion.done}/${summary.habitCompletion.expected}`}
                            leading={<Ring percent={summary.habitCompletion.percent} />}
                        />
                        <Metric
                            value={summary.workouts}
                            label={`Sessions · ${formatMinutes(summary.workoutMinutes)}`}
                        />
                        <Metric
                            value={formatMinutes(summary.studyMinutes)}
                            label={`Studied · ${summary.studySessions} sessions`}
                            animate={false}
                        />
                    </MetricRow>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
                        {/* Evidence */}
                        <section className="flex flex-col gap-6">
                            <div>
                                <SectionHeader title="Habits this period" />
                                <div className="flex flex-col gap-3">
                                    {summary.habits.map(habit => (
                                        <div key={habit.habitId} className="flex items-center gap-3">
                                            <HabitIcon icon={habit.icon} className={cn(ICON.md, "shrink-0 text-foreground/55")} />
                                            <span className={cn('w-24 shrink-0 truncate', T.body, INK.default)}>
                                                {habit.name}
                                            </span>
                                            <ProgressBar percent={habit.completion.percent} className="flex-1" />
                                            <span className={cn('w-9 shrink-0 text-right text-[11px]', NUM, INK.muted)}>
                                                {habit.completion.expected === 0 ? '—' : `${habit.completion.percent}%`}
                                            </span>
                                            {habit.streak > 0 && (
                                                <span className={cn('flex w-8 shrink-0 items-center gap-0.5 text-[11px]', NUM, INK.subtle)}>
                                                    <Flame className="h-3 w-3" strokeWidth={2} />
                                                    {habit.streak}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={cn('flex flex-col gap-2 border-t pt-4', HAIRLINE)}>
                                <div className="flex items-center justify-between">
                                    <span className={LABEL}>Routines</span>
                                    <span className={cn('text-[11px]', NUM, INK.muted)}>
                                        {summary.routineCompletion.done}/{summary.routineCompletion.expected}
                                        {' · '}{summary.routineCompletion.percent}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={LABEL}>Journal entries</span>
                                    <span className={cn('text-[11px]', NUM, INK.muted)}>
                                        {summary.journalEntries}
                                        {summary.averageDayRating !== null && ` · avg ${summary.averageDayRating}/10`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={LABEL}>Goals</span>
                                    <span className={cn('text-[11px]', NUM, INK.muted)}>
                                        {summary.goalsBehind > 0 ? `${summary.goalsBehind} behind pace` : 'all on pace'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Reflection */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <SectionHeader title="Reflection" />
                                {review?.completedAt && <StatusBadge tone="success">Completed</StatusBadge>}
                            </div>

                            {PROMPTS.map(prompt => (
                                <PromptField
                                    key={prompt.field}
                                    label={prompt.label}
                                    placeholder={prompt.placeholder}
                                    value={(review?.[prompt.field] as string) ?? ''}
                                    onChange={v => writeReview(prompt.field, v)}
                                />
                            ))}

                            <button
                                type="button"
                                onClick={() =>
                                    review &&
                                    update('reviews', review.id, {
                                        completedAt: review.completedAt ? null : new Date().toISOString(),
                                    })
                                }
                                disabled={!review}
                                className={cn('self-start px-3 py-2', R.md, T.button,
                                    review?.completedAt
                                        ? cn('border', HAIRLINE, INK.muted)
                                        : 'bg-foreground text-background',
                                    'transition-opacity hover:opacity-90',
                                    'disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                            >
                                {review?.completedAt ? 'Reopen review' : 'Mark review complete'}
                            </button>
                        </section>
                    </div>
                </>
            )}
        </div>
    )
}

/** One journal entry, collapsed to what was actually written. */
function JournalRow({ entry }: { entry: JournalEntry }) {
    const written = [
        entry.biggestWin && { label: 'Win', text: entry.biggestWin },
        entry.couldImprove && { label: 'Improve', text: entry.couldImprove },
        entry.tomorrowPriority && { label: 'Next', text: entry.tomorrowPriority },
        entry.freeform && { label: '', text: entry.freeform },
    ].filter(Boolean) as { label: string; text: string }[]

    /*
     * A row separated by a hairline, not a card.
     *
     * Three two-line entries were three bordered boxes, which is the pattern §45
     * warns against — chrome proportional to the container rather than to the
     * content. A rule between entries does the same separating work and lets the
     * dates, which are what you actually scan, carry the rhythm.
     */
    return (
        <div className={cn('flex flex-col gap-2 border-b py-4 last:border-b-0', HAIRLINE)}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className={cn(T.title, INK.strong)}>{longDateLabel(entry.date)}</span>
                <div className={cn('flex items-center gap-3 text-[11px]', NUM, INK.muted)}>
                    {entry.mood !== null && <span>Mood {entry.mood}/5</span>}
                    {entry.energy !== null && <span>Energy {entry.energy}/5</span>}
                    {/* A day rating is a measurement, not an outcome — colouring
                        7+ green implied a pass mark nobody asked for. */}
                    {entry.dayRating !== null && <span>{entry.dayRating}/10</span>}
                </div>
            </div>

            {written.length === 0 ? (
                <p className={cn('text-[12px]', INK.subtle)}>Rated only — nothing written.</p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {written.map((part, i) => (
                        <p key={i} className={cn('text-[12.5px] leading-[1.5]', INK.muted)}>
                            {part.label && <span className={cn('mr-1.5', INK.subtle)}>{part.label}:</span>}
                            {part.text}
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}
