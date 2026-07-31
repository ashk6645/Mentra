'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, RotateCcw, CalendarDays, LayoutGrid, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Segmented, type SegmentOption } from './segmented'
import { WeekStrip } from './week-strip'
import { DayPanel } from './day-panel'
import { HabitGrid } from './habit-grid'
import { MonthView } from './month-view'
import { SummaryBar } from './summary-bar'
import { AddHabitDialog } from './add-habit-dialog'
import { useSecondBrain } from '@/lib/second-brain/use-second-brain'
import { weekDays, todayKey, weekRangeLabel } from '@/lib/second-brain/date'
import { monthDays, monthLabel } from '@/lib/second-brain/stats'
import { SURFACE, HAIRLINE, FOCUS, QUICK } from '@/lib/second-brain/ui'

type ViewMode = 'day' | 'week' | 'month'

const VIEWS: SegmentOption<ViewMode>[] = [
    { id: 'day', label: 'Day', icon: Rows3 },
    { id: 'week', label: 'Week', icon: LayoutGrid },
    { id: 'month', label: 'Month', icon: CalendarDays },
]

function LoadingShell() {
    return (
        <div className="flex flex-col gap-6" aria-busy>
            <div className="h-[74px] animate-pulse rounded-[14px] bg-black/[0.035] dark:bg-white/[0.04]" />
            <div className="h-[300px] animate-pulse rounded-[14px] bg-black/[0.035] dark:bg-white/[0.04]" />
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
                'flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground',
                'transition-colors duration-150',
                'hover:bg-black/[0.045] hover:text-foreground dark:hover:bg-white/[0.07]',
                FOCUS
            )}
        >
            {children}
        </button>
    )
}

export function SecondBrainView() {
    const api = useSecondBrain()

    const [view, setView] = useState<ViewMode>('week')
    // Anchored to a date inside the visible range rather than an index, so month
    // and year boundaries fall out of the date helpers.
    const [anchor, setAnchor] = useState(() => new Date())
    const [selectedDate, setSelectedDate] = useState(() => todayKey())
    const [addOpen, setAddOpen] = useState(false)

    const days = useMemo(
        () => (view === 'month' ? monthDays(anchor) : weekDays(anchor)),
        [anchor, view]
    )

    const rangeLabel = view === 'month' ? monthLabel(anchor) : weekRangeLabel(weekDays(anchor))

    const step = (delta: number) => {
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
    }

    const jumpToToday = () => {
        setAnchor(new Date())
        setSelectedDate(todayKey())
    }

    const showingToday = days.includes(todayKey())

    const openDay = (date: string) => {
        setSelectedDate(date)
        setView('day')
    }

    return (
        <div className="flex flex-col gap-6">
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
                                    'rounded-[9px] px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground',
                                    'transition-colors hover:bg-black/[0.045] hover:text-foreground dark:hover:bg-white/[0.07]',
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
                        className={cn(
                            'flex items-center gap-1.5 rounded-[9px] border px-2.5 py-[7px]',
                            'text-[13px] font-medium text-foreground',
                            HAIRLINE,
                            'transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
                            FOCUS
                        )}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New habit</span>
                    </button>
                </div>
            </div>

            {!api.hydrated ? (
                <LoadingShell />
            ) : (
                <>
                    <SummaryBar
                        days={days}
                        habits={api.habits}
                        isDone={api.isHabitDone}
                        rangeLabel={view === 'month' ? 'this month' : 'this week'}
                    />

                    {/* Range navigation */}
                    <div className="flex items-center gap-0.5">
                        <NavButton
                            onClick={() => step(-1)}
                            label={view === 'month' ? 'Previous month' : 'Previous week'}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </NavButton>

                        <span className="min-w-[128px] text-center text-[12.5px] font-medium tracking-[-0.01em] text-foreground">
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
                                <div className="flex flex-col gap-7">
                                    <WeekStrip
                                        days={weekDays(anchor)}
                                        selectedDate={selectedDate}
                                        progressFor={api.progressForDate}
                                        onSelect={setSelectedDate}
                                    />
                                    <DayPanel date={selectedDate} api={api} />
                                </div>
                            )}
                    </motion.div>

                    <footer
                        className={cn(
                            'mt-2 flex flex-wrap items-center justify-between gap-3 border-t pt-5',
                            HAIRLINE
                        )}
                    >
                        <p className="text-[11.5px] text-muted-foreground/80">
                            Demo — saved in this browser only. Not synced, and separate from your tasks.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Reset the demo back to its starting habits?')) {
                                    api.reset()
                                    jumpToToday()
                                }
                            }}
                            className={cn(
                                'flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[11.5px] text-muted-foreground',
                                'transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]',
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
        </div>
    )
}

export { SURFACE }
