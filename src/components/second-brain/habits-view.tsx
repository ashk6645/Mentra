'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, RotateCcw, CalendarDays, LayoutGrid, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Segmented, type SegmentOption } from './segmented'
import { useConfirm } from './confirm-dialog'
import { notify } from '@/lib/second-brain/feedback'
import { WeekStrip } from './week-strip'
import { DayPanel } from './day-panel'
import { HabitGrid } from './habit-grid'
import { MonthView } from './month-view'
import { SummaryBar } from './summary-bar'
import { AddHabitDialog } from './add-habit-dialog'
import { EmptyState } from './empty-state'
import { ShortcutsSheet } from './shortcuts-sheet'
import { Kbd } from './kbd'
import { useShortcuts, type Shortcut } from '@/lib/second-brain/use-shortcuts'
import { useHabitsView } from '@/lib/second-brain/use-habits-view'
import { weekDays, todayKey, weekRangeLabel } from '@/lib/second-brain/date'
import { monthDays, monthLabel } from '@/lib/second-brain/date'
import { HAIRLINE, FOCUS, QUICK, R, T, INK } from '@/lib/second-brain/ui'

type ViewMode = 'day' | 'week' | 'month'

const VIEWS: SegmentOption<ViewMode>[] = [
    { id: 'day', label: 'Day', icon: Rows3 },
    { id: 'week', label: 'Week', icon: LayoutGrid },
    { id: 'month', label: 'Month', icon: CalendarDays },
]

function LoadingShell() {
    return (
        <div className="flex flex-col gap-6" aria-busy>
            <div className="h-[74px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            <div className="h-[300px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
        </div>
    )
}

/** Icon-only chevron, used for range navigation. */
function NavButton({
    onClick,
    label,
    children,
}: {
    onClick: () => void
    label: string
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn(
                'flex h-7 w-7 items-center justify-center', R.md, INK.muted,
                'transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground',
                FOCUS
            )}
        >
            {children}
        </button>
    )
}

export function HabitsView() {
    const api = useHabitsView()

    const [view, setView] = useState<ViewMode>('week')
    // Anchored to a date inside the visible range rather than an index, so month
    // and year boundaries fall out of the date helpers.
    const [anchor, setAnchor] = useState(() => new Date())
    const [selectedDate, setSelectedDate] = useState(() => todayKey())
    const [addOpen, setAddOpen] = useState(false)
    const { confirm, dialog } = useConfirm()
    const [shortcutsOpen, setShortcutsOpen] = useState(false)

    const days = useMemo(
        () => (view === 'month' ? monthDays(anchor) : weekDays(anchor)),
        [anchor, view]
    )

    const rangeLabel = view === 'month' ? monthLabel(anchor) : weekRangeLabel(weekDays(anchor))

    const step = useCallback((delta: number) => {
        const next = new Date(anchor)

        if (view === 'month') {
            // Snap to the 1st first: from the 31st, "next month" would skip a short one.
            next.setDate(1)
            next.setMonth(next.getMonth() + delta)
        } else {
            next.setDate(next.getDate() + delta * 7)
        }

        setAnchor(next)

        // Hold the same weekday when paging weeks — that's what you want when
        // scanning "how are my Thursdays going".
        if (view !== 'month') {
            const nextWeek = weekDays(next)
            const index = weekDays(anchor).indexOf(selectedDate)
            setSelectedDate(nextWeek[index === -1 ? 0 : index])
        }
    }, [view, anchor, selectedDate])

    const jumpToToday = useCallback(() => {
        setAnchor(new Date())
        setSelectedDate(todayKey())
    }, [])

    const showingToday = days.includes(todayKey())

    const openDay = (date: string) => {
        setSelectedDate(date)
        setView('day')
    }

    /**
     * Single-key shortcuts. Unmodified keys are safe because the hook ignores
     * keystrokes aimed at inputs; anything with a modifier is left to the browser.
     *
     * One hook, one listener, one source of truth. An earlier version split this
     * across two `useShortcuts` calls — a gated set plus an always-live `?` — and
     * the two bindings for the same key raced, so `?` opened the sheet but never
     * closed it. Gating inside `run` keeps exactly one binding per key.
     *
     * Rebuilds when the sheet toggles or the visible range moves — a handful of
     * times per session, not per render — in exchange for a listener that reads
     * current state directly and cannot desync.
     */
    const shortcuts = useMemo<Shortcut[]>(() => {
        // Suspended while the sheet is up, so pressing M to read the list doesn't
        // silently switch the view behind it. `?` is never gated — it has to be
        // able to close what it opened.
        const gated = (fn: () => void) => () => {
            if (shortcutsOpen) return
            fn()
        }

        return [
            { key: 'd', display: 'D', description: 'Day view', group: 'Views', run: gated(() => setView('day')) },
            { key: 'w', display: 'W', description: 'Week view', group: 'Views', run: gated(() => setView('week')) },
            { key: 'm', display: 'M', description: 'Month view', group: 'Views', run: gated(() => setView('month')) },
            { key: 'ArrowLeft', display: '\u2190', description: 'Previous period', group: 'Navigate', run: gated(() => step(-1)) },
            { key: 'ArrowRight', display: '\u2192', description: 'Next period', group: 'Navigate', run: gated(() => step(1)) },
            { key: 't', display: 'T', description: 'Jump to today', group: 'Navigate', run: gated(jumpToToday) },
            { key: 'n', display: 'N', description: 'New habit', group: 'Actions', run: gated(() => setAddOpen(true)) },
            { key: '?', display: '?', description: 'Show this list', group: 'Actions', run: () => setShortcutsOpen(o => !o) },
        ]
    }, [jumpToToday, shortcutsOpen, step])

    // Disabled outright behind the add dialog, where the name field takes the keys.
    useShortcuts(shortcuts, !addOpen)

    return (
        <div className="flex flex-col gap-6">
            {dialog}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented options={VIEWS} value={view} onChange={setView} ariaLabel="View" />

                <div className="flex items-center gap-2">
                    <AnimatePresence initial={false}>
                        {!showingToday && (
                            <motion.button
                                type="button"
                                onClick={jumpToToday}
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.94 }}
                                transition={QUICK}
                                className={cn(
                                    'px-2.5 py-1.5', R.md, T.button, INK.muted,
                                    'transition-colors hover:bg-foreground/[0.06] hover:text-foreground',
                                    FOCUS
                                )}
                            >
                                Today
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        // The label collapses below `sm`, which would otherwise leave a
                        // button announced as just "button". Named explicitly instead.
                        aria-label="New habit"
                        className={cn(
                            'group flex items-center gap-1.5 border px-2.5 py-1.5',
                            R.md, T.button, INK.strong, HAIRLINE,
                            'transition-colors hover:bg-foreground/[0.04]',
                            FOCUS
                        )}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New habit</span>
                        {/* The shortcut surfaces on hover — the way you find out a
                            keyboard layer exists without reading documentation. */}
                        <Kbd className="ml-0.5 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex">
                            N
                        </Kbd>
                    </button>
                </div>
            </div>

            {!api.hydrated ? (
                <LoadingShell />
            ) : (
                <>
                    {api.habits.length > 0 && (
                        <SummaryBar
                            days={days}
                            habits={api.habits}
                            isDone={api.isHabitDone}
                            rangeLabel={view === 'month' ? 'this month' : 'this week'}
                        />
                    )}

                    {/* Range navigation. Hidden while empty — there is nothing to
                        page through, and it just frames the empty state with clutter. */}
                    <div className={cn('flex items-center gap-0.5', api.habits.length === 0 && 'hidden')}>
                        <NavButton
                            onClick={() => step(-1)}
                            label={view === 'month' ? 'Previous month' : 'Previous week'}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </NavButton>

                        <span className={cn('min-w-[128px] text-center', T.button, INK.strong)}>
                            {rangeLabel}
                        </span>

                        <NavButton
                            onClick={() => step(1)}
                            label={view === 'month' ? 'Next month' : 'Next week'}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </NavButton>
                    </div>

                    {/* Keyed remount rather than AnimatePresence.
                        `mode="wait"` deadlocked here — the outgoing view's exit never
                        resolved, so the incoming one never mounted and Month was
                        unreachable. Changing the key unmounts the old tree outright and
                        replays `initial` on the new one: same fade-in, no exit to stall. */}
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={QUICK}
                    >
                            {api.habits.length === 0 ? (
                                <EmptyState onAdd={() => setAddOpen(true)} />
                            ) : (
                              <>
                            {view === 'week' && (
                                <HabitGrid
                                    days={days}
                                    habits={api.habits}
                                    isDone={api.isHabitDone}
                                    onToggle={api.toggleHabit}
                                    onSelectDay={openDay}
                                />
                            )}

                            {view === 'month' && (
                                <MonthView
                                    days={days}
                                    habits={api.habits}
                                    isDone={api.isHabitDone}
                                    onToggle={api.toggleHabit}
                                />
                            )}

                            {view === 'day' && (
                                <div className="flex flex-col gap-8">
                                    <WeekStrip
                                        days={weekDays(anchor)}
                                        selectedDate={selectedDate}
                                        progressFor={api.progressForDate}
                                        onSelect={setSelectedDate}
                                    />
                                    <DayPanel date={selectedDate} api={api} />
                                </div>
                            )}
                              </>
                            )}
                    </motion.div>

                    <footer
                        className={cn(
                            'mt-2 flex flex-wrap items-center justify-between gap-3 border-t pt-5',
                            HAIRLINE
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <button
                                type="button"
                                onClick={() => setShortcutsOpen(true)}
                                className={cn(
                                    'flex items-center gap-1.5 px-1.5 py-1', R.sm, T.label, INK.muted,
                                    'transition-colors hover:text-foreground', FOCUS
                                )}
                            >
                                <Kbd>?</Kbd>
                                Shortcuts
                            </button>
                            <p className={cn(T.label, INK.subtle)}>
                                Demo — saved in this browser only, separate from your tasks.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const confirmed = await confirm({
                                    title: 'Reset the demo?',
                                    description:
                                        'Your habits and their history are replaced with the starting demo data.',
                                    confirmLabel: 'Reset',
                                    destructive: true,
                                })
                                if (!confirmed) return

                                api.reset()
                                jumpToToday()
                                notify('Reset to the demo data.')
                            }}
                            className={cn(
                                'flex items-center gap-1.5 px-2 py-1', R.sm, T.label, INK.muted,
                                'transition-colors hover:bg-foreground/[0.05] hover:text-foreground',
                                FOCUS
                            )}
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset demo
                        </button>
                    </footer>
                </>
            )}

            <AddHabitDialog open={addOpen} onOpenChange={setAddOpen} onAdd={api.addHabit} />
            <ShortcutsSheet
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
                shortcuts={shortcuts}
            />
        </div>
    )
}

