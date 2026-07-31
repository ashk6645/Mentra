'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, RotateCcw, CalendarDays, LayoutGrid, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WeekStrip } from './week-strip'
import { DayPanel } from './day-panel'
import { HabitGrid } from './habit-grid'
import { MonthView } from './month-view'
import { SummaryBar } from './summary-bar'
import { AddHabitDialog } from './add-habit-dialog'
import { useSecondBrain } from '@/lib/second-brain/use-second-brain'
import { weekDays, todayKey, weekRangeLabel } from '@/lib/second-brain/date'
import { monthDays, monthLabel } from '@/lib/second-brain/stats'

type ViewMode = 'day' | 'week' | 'month'

const VIEWS: { id: ViewMode; label: string; icon: typeof Rows3 }[] = [
    { id: 'day', label: 'Day', icon: Rows3 },
    { id: 'week', label: 'Week', icon: LayoutGrid },
    { id: 'month', label: 'Month', icon: CalendarDays },
]

function LoadingShell() {
    return (
        <div className="flex flex-col gap-6" aria-busy>
            <div className="h-[72px] animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
            <div className="h-[280px] animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800/50" />
        </div>
    )
}

export function SecondBrainView() {
    const api = useSecondBrain()

    const [view, setView] = useState<ViewMode>('week')
    // Anchored to a date inside the visible range rather than an index, so month
    // and year boundaries fall out of the date helpers rather than arithmetic here.
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
            // Snap to the 1st before shifting: from the 31st, "next month" would
            // otherwise skip a short month entirely.
            next.setDate(1)
            next.setMonth(next.getMonth() + delta)
        } else {
            next.setDate(next.getDate() + delta * 7)
        }

        setAnchor(next)

        // Keep the same weekday selected when paging weeks — that's what you want
        // when scanning "how are my Thursdays going".
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
                {/* View switcher */}
                <div
                    role="tablist"
                    aria-label="View"
                    className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800/60"
                >
                    {VIEWS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={view === id}
                            onClick={() => setView(id)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[13px] font-medium transition-all',
                                'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                view === id
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    {!showingToday && (
                        <Button variant="ghost" size="sm" onClick={jumpToToday} className="h-8 text-[13px]">
                            Today
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddOpen(true)}
                        className="h-8 gap-1.5 text-[13px]"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New habit</span>
                    </Button>
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
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => step(-1)}
                            aria-label={view === 'month' ? 'Previous month' : 'Previous week'}
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors',
                                'hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800/60',
                                'outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            )}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="min-w-[130px] text-center text-[13px] font-medium text-foreground">
                            {rangeLabel}
                        </span>

                        <button
                            type="button"
                            onClick={() => step(1)}
                            aria-label={view === 'month' ? 'Next month' : 'Next week'}
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors',
                                'hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800/60',
                                'outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            )}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

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

                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200/70 pt-5 dark:border-neutral-800">
                        <p className="text-[12px] text-muted-foreground">
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
                                'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-muted-foreground transition-colors',
                                'hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800/60',
                                'outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
