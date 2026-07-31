'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CheckRow } from './check-row'
import { TIME_OF_DAY_ORDER, TIME_OF_DAY_LABEL, type TimeOfDay } from '@/lib/second-brain/types'
import { longDateLabel, todayKey, isPast, isFuture } from '@/lib/second-brain/date'
import type { SecondBrainApi } from '@/lib/second-brain/use-second-brain'

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** "Every day" / "Mon, Wed, Fri" — shown as a quiet hint beside each habit. */
function scheduleHint(scheduleDays: number[]): string {
    if (scheduleDays.length === 0) return 'Every day'
    if (scheduleDays.length === 7) return 'Every day'

    const sorted = [...scheduleDays].sort((a, b) => a - b)

    const isWeekdays = sorted.length === 5 && sorted.every((d, i) => d === i + 1)
    if (isWeekdays) return 'Weekdays'

    const isWeekend = sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6
    if (isWeekend) return 'Weekends'

    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Six days reads better as the exception: "Except Sun" beats
    // "Mon, Tue, Wed, Thu, Fri, Sat".
    if (sorted.length === 6) {
        const missing = [0, 1, 2, 3, 4, 5, 6].find(d => !sorted.includes(d))!
        return `Except ${names[missing]}`
    }

    return sorted.map(d => names[d]).join(', ')
}

interface InlineAddProps {
    timeOfDay: TimeOfDay
    onAdd: (title: string, timeOfDay: TimeOfDay) => void
}

function InlineAdd({ timeOfDay, onAdd }: InlineAddProps) {
    const [value, setValue] = useState('')
    const [open, setOpen] = useState(false)

    const submit = () => {
        if (value.trim()) {
            onAdd(value, timeOfDay)
            setValue('')
            // Stay open so several items can be added in a row.
        } else {
            setOpen(false)
        }
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground',
                    'transition-colors hover:bg-neutral-100/80 hover:text-foreground dark:hover:bg-neutral-800/50',
                    'outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
            >
                <Plus className="h-3.5 w-3.5" />
                Add item
            </button>
        )
    }

    return (
        <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') {
                    setValue('')
                    setOpen(false)
                }
            }}
            onBlur={submit}
            placeholder="What needs doing?"
            className={cn(
                'w-full rounded-lg border border-neutral-200 bg-transparent px-2.5 py-2 text-[14px] dark:border-neutral-700',
                'placeholder:text-muted-foreground focus:border-neutral-400 dark:focus:border-neutral-500',
                'outline-none transition-colors'
            )}
        />
    )
}

interface DayPanelProps {
    date: string
    api: SecondBrainApi
}

/**
 * Everything scheduled for one day, grouped morning / afternoon / evening.
 *
 * Sections with nothing in them still render their add button, so the day always
 * offers somewhere to put a thought rather than presenting a dead end.
 */
export function DayPanel({ date, api }: DayPanelProps) {
    const { habitsForDate, tasksForDate, isHabitDone, toggleHabit, addTask, toggleTask, deleteTask, deleteHabit } = api

    const habits = habitsForDate(date)
    const tasks = tasksForDate(date)
    const progress = api.progressForDate(date)

    /** Group both kinds of item by time of day in one pass. */
    const sections = useMemo(
        () =>
            TIME_OF_DAY_ORDER.map(slot => ({
                slot,
                habits: habits.filter(h => h.timeOfDay === slot),
                tasks: tasks.filter(t => t.timeOfDay === slot),
            })),
        [habits, tasks]
    )

    const today = date === todayKey()
    const pct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)
    const allDone = progress.total > 0 && progress.done === progress.total

    return (
        <section className="flex flex-col gap-6">
            {/* Day heading + progress */}
            <header className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="text-[15px] font-semibold text-foreground">
                        {today ? 'Today' : longDateLabel(date)}
                        {today && (
                            <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                                {longDateLabel(date)}
                            </span>
                        )}
                    </h2>

                    <span className="text-[13px] tabular-nums text-muted-foreground">
                        {progress.total === 0
                            ? 'Nothing scheduled'
                            : `${progress.done} of ${progress.total} done`}
                    </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-700/50">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-500 ease-out',
                            allDone ? 'bg-emerald-500' : 'bg-primary'
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>

                {(isPast(date) || isFuture(date)) && (
                    <p className="text-[12px] text-muted-foreground">
                        {isPast(date)
                            ? 'Viewing a past day — you can still tick things off.'
                            : 'Viewing an upcoming day.'}
                    </p>
                )}
            </header>

            {/* Time-of-day sections */}
            <div className="flex flex-col gap-6">
                {sections.map(({ slot, habits: slotHabits, tasks: slotTasks }) => (
                    <div key={slot} className="flex flex-col gap-1">
                        <div className="mb-1 flex items-center gap-2 px-2.5">
                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {TIME_OF_DAY_LABEL[slot]}
                            </h3>
                            <span className="text-[11px] tabular-nums text-muted-foreground/70">
                                {slotHabits.length + slotTasks.length || ''}
                            </span>
                        </div>

                        {slotHabits.map(habit => (
                            <CheckRow
                                key={habit.id}
                                id={habit.id}
                                label={habit.name}
                                icon={habit.icon}
                                hint={scheduleHint(habit.scheduleDays)}
                                completed={isHabitDone(habit.id, date)}
                                onToggle={() => toggleHabit(habit.id, date)}
                                onDelete={deleteHabit}
                                deleteLabel="Delete habit"
                            />
                        ))}

                        {slotTasks.map(task => (
                            <CheckRow
                                key={task.id}
                                id={task.id}
                                label={task.title}
                                completed={task.completed}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                deleteLabel="Delete item"
                            />
                        ))}

                        <InlineAdd
                            timeOfDay={slot}
                            onAdd={(title, tod) => addTask(title, date, tod)}
                        />
                    </div>
                ))}
            </div>
        </section>
    )
}

export { DAY_INITIALS }
