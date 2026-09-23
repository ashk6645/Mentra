'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Card, EmptyState, IconButton, PageHeader, Reveal, Ring, Stat, StatGrid } from './primitives'
import { Segmented } from './segmented'
import { HabitTable } from './habit-table'
import { HabitDialog } from './habit-dialog'
import { ShortcutsSheet } from './shortcuts-sheet'
import { Kbd } from './kbd'
import { useShortcuts, type Shortcut } from '@/lib/second-brain/use-shortcuts'
import { useSecondBrainData, useStoreReady } from '@/lib/second-brain/repo'
import { monthDays, monthLabel, todayKey, weekDays, weekRangeLabel } from '@/lib/second-brain/date'
import {
    buildEntryIndex, habitCompletion, habitStreak, isDueToday, isWeeklyCount, lookupFrom, sortByTimeOfDay,
} from '@/lib/second-brain/domain/selectors'
import type { Habit } from '@/lib/second-brain/domain/types'
import { HAIRLINE, INK, MOTION, NUM, T, TRANSITION } from '@/lib/second-brain/ui'

type View = 'week' | 'month'

const VIEWS = [
    { id: 'week' as const, label: 'Week' },
    { id: 'month' as const, label: 'Month' },
]

function streakUnit(best: { habit: Habit; streak: number } | null): string {
    if (!best) return ' days'
    const unit = isWeeklyCount(best.habit) ? 'week' : 'day'
    return ` ${unit}${best.streak === 1 ? '' : 's'}`
}

export function HabitsView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()

    const [view, setView] = useState<View>('week')
    // A date inside the visible range, not an index — month and year boundaries
    // then fall out of the date helpers.
    const [anchor, setAnchor] = useState(() => new Date())
    const [dialog, setDialog] = useState<{ open: boolean; habit: Habit | null; key: string }>({
        open: false, habit: null, key: 'new',
    })
    const [helpOpen, setHelpOpen] = useState(false)

    const today = todayKey()
    const habits = useMemo(() => sortByTimeOfDay(data.habits), [data.habits])
    const isDone = useMemo(() => lookupFrom(buildEntryIndex(data.habitEntries)), [data.habitEntries])
    const days = useMemo(() => (view === 'week' ? weekDays(anchor) : monthDays(anchor)), [view, anchor])
    const showingToday = days.includes(today)
    const rangeLabel = view === 'week' ? weekRangeLabel(days) : monthLabel(anchor)

    // Left to the React Compiler to memoise — it tracks these inputs better than
    // a hand-written dependency list does.
    const stats = (() => {
        const due = habits.filter(h => isDueToday(h, isDone, today))
        const doneToday = due.filter(h => isDone(h.id, today)).length

        const range = habits.reduce(
            (acc, h) => {
                const c = habitCompletion(h, isDone, days, today)
                return { done: acc.done + c.done, expected: acc.expected + c.expected }
            },
            { done: 0, expected: 0 }
        )

        const best = habits
            .map(habit => ({ habit, streak: habitStreak(habit, isDone, today) }))
            .sort((a, b) => b.streak - a.streak)[0]

        return {
            doneToday,
            dueToday: due.length,
            rate: range.expected === 0 ? 0 : Math.round((range.done / range.expected) * 100),
            best,
        }
    })()

    const step = useCallback((delta: number) => {
        setAnchor(prev => {
            const next = new Date(prev)
            if (view === 'month') {
                // Snap to the 1st first: from the 31st, "next month" would skip a short one.
                next.setDate(1)
                next.setMonth(next.getMonth() + delta)
            } else {
                next.setDate(next.getDate() + delta * 7)
            }
            return next
        })
    }, [view])

    const openCreate = useCallback(() => setDialog({ open: true, habit: null, key: `new-${Date.now()}` }), [])
    const openEdit = useCallback((habit: Habit) => setDialog({ open: true, habit, key: habit.id }), [])

    const shortcuts = useMemo<Shortcut[]>(() => [
        { key: 'n', display: 'N', description: 'New habit', run: openCreate },
        { key: 'w', display: 'W', description: 'Week view', run: () => setView('week') },
        { key: 'm', display: 'M', description: 'Month view', run: () => setView('month') },
        { key: 'ArrowLeft', display: '←', description: 'Previous period', run: () => step(-1) },
        { key: 'ArrowRight', display: '→', description: 'Next period', run: () => step(1) },
        { key: '?', display: '?', description: 'Show shortcuts', run: () => setHelpOpen(o => !o) },
    ], [openCreate, step])

    useShortcuts(shortcuts, ready && !dialog.open)

    const best = stats.best && stats.best.streak > 0 ? stats.best : null

    return (
        <>
            <Reveal index={0}>
                <PageHeader
                    title="Habits"
                    description="Small things, repeated. Tick a day to log it."
                    actions={
                        <Button variant="primary" icon={Plus} kbd="N" onClick={openCreate}>
                            New habit
                        </Button>
                    }
                />
            </Reveal>

            {ready && habits.length === 0 && (
                <Reveal index={1}>
                    <Card>
                        <EmptyState
                            icon={Repeat}
                            title="No habits yet"
                            description="Add something you want to do regularly — daily, on set days, or a few times a week."
                            action={<Button variant="primary" icon={Plus} onClick={openCreate}>New habit</Button>}
                        />
                    </Card>
                </Reveal>
            )}

            {ready && habits.length > 0 && (
                <>
                    <Reveal index={1}>
                        <StatGrid>
                            <Stat
                                label="Today"
                                value={stats.doneToday}
                                suffix={`/${stats.dueToday}`}
                                detail={stats.dueToday > 0 && stats.doneToday === stats.dueToday ? 'All done' : `${stats.dueToday - stats.doneToday} to go`}
                                visual={<Ring percent={stats.dueToday === 0 ? 0 : (stats.doneToday / stats.dueToday) * 100} />}
                            />
                            <Stat
                                label={showingToday ? (view === 'week' ? 'This week' : 'This month') : rangeLabel}
                                value={stats.rate}
                                suffix="%"
                                detail="of scheduled days"
                                visual={<Ring percent={stats.rate} />}
                            />
                            <Stat
                                label="Best streak"
                                value={best?.streak ?? 0}
                                suffix={streakUnit(best)}
                                detail={best ? best.habit.name : 'Start one today'}
                            />
                        </StatGrid>
                    </Reveal>

                    <Reveal index={2}>
                        <Card>
                            <div className={cn('flex h-12 items-center justify-between gap-3 border-b px-3', HAIRLINE)}>
                                <div className="flex min-w-0 items-center gap-1">
                                    <IconButton icon={ChevronLeft} label={view === 'week' ? 'Previous week' : 'Previous month'} onClick={() => step(-1)} />
                                    <span className={cn('min-w-[112px] text-center', T.button, NUM, INK.strong)}>{rangeLabel}</span>
                                    <IconButton icon={ChevronRight} label={view === 'week' ? 'Next week' : 'Next month'} onClick={() => step(1)} />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAnchor(new Date())}
                                        className={cn('ml-1', TRANSITION.base, showingToday && 'pointer-events-none opacity-0')}
                                        tabIndex={showingToday ? -1 : 0}
                                        aria-hidden={showingToday}
                                    >
                                        Today
                                    </Button>
                                </div>
                                <Segmented options={VIEWS} value={view} onChange={setView} ariaLabel="View" />
                            </div>

                            {/* Cross-fades on switching view, rather than snapping. */}
                            <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
                                <HabitTable
                                    variant={view}
                                    days={days}
                                    habits={habits}
                                    isDone={isDone}
                                    today={today}
                                    onEdit={openEdit}
                                    onCreate={openCreate}
                                />
                            </motion.div>
                        </Card>
                    </Reveal>

                    <Reveal index={3}>
                        <button
                            type="button"
                            onClick={() => setHelpOpen(true)}
                            className={cn('flex items-center gap-2', T.meta, INK.subtle, TRANSITION.fast, 'hover:text-foreground')}
                        >
                            <Kbd>?</Kbd>
                            Keyboard shortcuts
                        </button>
                    </Reveal>
                </>
            )}

            <HabitDialog
                key={dialog.key}
                open={dialog.open}
                onOpenChange={open => setDialog(prev => ({ ...prev, open }))}
                habit={dialog.habit}
            />
            <ShortcutsSheet open={helpOpen} onOpenChange={setHelpOpen} shortcuts={shortcuts} />
        </>
    )
}
