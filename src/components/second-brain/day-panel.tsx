'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CheckRow } from './check-row'
import { TIME_OF_DAY_ORDER, TIME_OF_DAY_LABEL, type TimeOfDay } from '@/lib/second-brain/types'
import { longDateLabel, todayKey, isPast, isFuture } from '@/lib/second-brain/date'
import type { SecondBrainApi } from '@/lib/second-brain/use-second-brain'
import { LABEL, NUM, FOCUS, HAIRLINE, BAR_SPRING, HOVER } from '@/lib/second-brain/ui'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "Every day" / "Weekdays" / "Except Sun" — a quiet hint beside each habit. */
function scheduleHint(scheduleDays: number[]): string {
    if (scheduleDays.length === 0 || scheduleDays.length === 7) return 'Every day'

    const sorted = [...scheduleDays].sort((a, b) => a - b)

    if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Weekdays'
    if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return 'Weekends'

    // Six days reads better as the exception it is.
    if (sorted.length === 6) {
        const missing = [0, 1, 2, 3, 4, 5, 6].find(d => !sorted.includes(d))!
        return `Except ${DAY_NAMES[missing]}`
    }

    return sorted.map(d => DAY_NAMES[d]).join(', ')
}

function InlineAdd({
    timeOfDay,
    onAdd,
}: {
    timeOfDay: TimeOfDay
    onAdd: (title: string, timeOfDay: TimeOfDay) => void
}) {
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
                    'flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-[13px] text-muted-foreground/70',
                    'transition-colors duration-150 hover:text-foreground',
                    HOVER,
                    FOCUS
                )}
            >
                <span className="flex h-[19px] w-[19px] items-center justify-center">
                    <Plus className="h-3.5 w-3.5" />
                </span>
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
                'w-full rounded-[8px] border bg-transparent px-3 py-2 text-[13px]',
                HAIRLINE,
                'placeholder:text-muted-foreground/60',
                'outline-none transition-colors focus:border-primary/40'
            )}
        />
    )
}

interface DayPanelProps {
    date: string
    api: SecondBrainApi
}

export function DayPanel({ date, api }: DayPanelProps) {
    const {
        habitsForDate,
        tasksForDate,
        isHabitDone,
        toggleHabit,
        addTask,
        toggleTask,
        deleteTask,
        deleteHabit,
    } = api

    const habits = habitsForDate(date)
    const tasks = tasksForDate(date)
    const progress = api.progressForDate(date)

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
    const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)
    const allDone = progress.total > 0 && progress.done === progress.total

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                            {today ? 'Today' : longDateLabel(date)}
                        </h2>
                        {today && (
                            <span className="text-[13px] text-muted-foreground">
                                {longDateLabel(date)}
                            </span>
                        )}
                    </div>

                    <span className={cn('text-[13px] text-muted-foreground', NUM)}>
                        {progress.total === 0
                            ? 'Nothing scheduled'
                            : `${progress.done} of ${progress.total} done`}
                    </span>
                </div>

                <div className="h-[3px] w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.09]">
                    <motion.div
                        className={cn(
                            'h-full rounded-full',
                            allDone ? 'bg-emerald-500' : 'bg-foreground/55'
                        )}
                        initial={false}
                        animate={{ width: `${percent}%` }}
                        transition={BAR_SPRING}
                    />
                </div>

                {(isPast(date) || isFuture(date)) && (
                    <p className="text-[11px] text-muted-foreground/80">
                        {isPast(date)
                            ? 'Viewing a past day — you can still tick things off.'
                            : 'Viewing an upcoming day.'}
                    </p>
                )}
            </header>

            <div className="flex flex-col gap-7">
                {sections.map(({ slot, habits: slotHabits, tasks: slotTasks }) => {
                    const count = slotHabits.length + slotTasks.length

                    return (
                        <div key={slot} className="flex flex-col gap-0.5">
                            <div className="mb-2 flex items-center gap-2 px-2">
                                <h3 className={LABEL}>{TIME_OF_DAY_LABEL[slot]}</h3>
                                {count > 0 && (
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium text-muted-foreground/50',
                                            NUM
                                        )}
                                    >
                                        {count}
                                    </span>
                                )}
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
                    )
                })}
            </div>
        </section>
    )
}
