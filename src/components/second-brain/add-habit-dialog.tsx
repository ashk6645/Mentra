'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { TIME_OF_DAY_ORDER, TIME_OF_DAY_LABEL, type TimeOfDay } from '@/lib/second-brain/domain/types'
import { FOCUS, HAIRLINE, ICON, LABEL } from '@/lib/second-brain/ui'
import { HABIT_ICONS, DEFAULT_ICON_ID, HabitIcon } from '@/lib/second-brain/icons'

/** Sunday-first, matching the JS weekday numbering we store. */
const WEEKDAYS = [
    { value: 0, label: 'S', full: 'Sunday' },
    { value: 1, label: 'M', full: 'Monday' },
    { value: 2, label: 'T', full: 'Tuesday' },
    { value: 3, label: 'W', full: 'Wednesday' },
    { value: 4, label: 'T', full: 'Thursday' },
    { value: 5, label: 'F', full: 'Friday' },
    { value: 6, label: 'S', full: 'Saturday' },
]

const PRESETS = [
    { label: 'Every day', days: [] as number[] },
    { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
    { label: 'Weekends', days: [0, 6] },
]

interface AddHabitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (input: {
        name: string
        icon: string
        timeOfDay: TimeOfDay
        scheduleDays: number[]
    }) => void
}

/** Shared chip styling for the icon, slot, preset and weekday pickers. */
function chip(selected: boolean) {
    return cn(
        'rounded-[8px] border text-[13px] font-medium transition-colors duration-200',
        FOCUS,
        selected
            ? 'border-transparent bg-foreground text-background'
            : `${HAIRLINE} text-muted-foreground hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.05]`
    )
}

export function AddHabitDialog({ open, onOpenChange, onAdd }: AddHabitDialogProps) {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState(DEFAULT_ICON_ID)
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
    const [days, setDays] = useState<number[]>([])

    const reset = () => {
        setName('')
        setIcon(DEFAULT_ICON_ID)
        setTimeOfDay('morning')
        setDays([])
    }

    const close = (next: boolean) => {
        if (!next) reset()
        onOpenChange(next)
    }

    const submit = () => {
        if (!name.trim()) return
        onAdd({ name, icon, timeOfDay, scheduleDays: days })
        reset()
        onOpenChange(false)
    }

    const toggleDay = (value: number) =>
        setDays(prev => (prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]))

    const matchesPreset = (preset: number[]) =>
        preset.length === days.length && preset.every(d => days.includes(d))

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-semibold tracking-[-0.01em]">
                        New habit
                    </DialogTitle>
                    <DialogDescription className="text-[13px]">
                        Something you repeat. Leave the days unset for every day.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-1">
                    {/* Name, with the icon inline — one row instead of two fields. */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="habit-name" className={LABEL}>
                            Name
                        </label>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-[8px] border px-2.5 py-2 transition-colors',
                                HAIRLINE,
                                'focus-within:border-primary/40'
                            )}
                        >
                            <HabitIcon icon={icon} className={cn(ICON.lg, "shrink-0 text-foreground/70")} />
                            <input
                                id="habit-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submit()}
                                placeholder="Morning run"
                                autoFocus
                                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className={LABEL}>Icon</span>
                        <div className="grid grid-cols-8 gap-1.5">
                            {HABIT_ICONS.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setIcon(id)}
                                    aria-label={label}
                                    title={label}
                                    aria-pressed={icon === id}
                                    className={cn(
                                        'flex h-8 items-center justify-center rounded-[8px] border transition-colors duration-200',
                                        FOCUS,
                                        icon === id
                                            ? 'border-transparent bg-foreground text-background'
                                            : `${HAIRLINE} text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground`
                                    )}
                                >
                                    <Icon className={ICON.md} strokeWidth={1.75} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className={LABEL}>Time of day</span>
                        <div className="flex gap-1.5">
                            {TIME_OF_DAY_ORDER.map(slot => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setTimeOfDay(slot)}
                                    aria-pressed={timeOfDay === slot}
                                    className={cn('flex-1 py-2', chip(timeOfDay === slot))}
                                >
                                    {TIME_OF_DAY_LABEL[slot]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                            <span className={LABEL}>Repeat</span>
                            <span className="text-[11px] text-muted-foreground">
                                {days.length === 0 ? 'Every day' : `${days.length} day${days.length > 1 ? 's' : ''}`}
                            </span>
                        </div>

                        {/* Presets first — most habits are one of these three, and
                            tapping seven letters to mean "weekdays" is busywork. */}
                        <div className="flex gap-1.5">
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setDays(preset.days)}
                                    className={cn('flex-1 py-1.5', chip(matchesPreset(preset.days)))}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1.5">
                            {WEEKDAYS.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    aria-label={day.full}
                                    aria-pressed={days.includes(day.value)}
                                    className={cn('h-8 flex-1', chip(days.includes(day.value)))}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <button
                        type="button"
                        onClick={() => close(false)}
                        className={cn(
                            'rounded-[8px] px-3 py-2 text-[13px] font-medium text-muted-foreground',
                            'transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]',
                            FOCUS
                        )}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!name.trim()}
                        className={cn(
                            'rounded-[8px] bg-foreground px-3.5 py-2 text-[13px] font-medium text-background',
                            'transition-opacity hover:opacity-90 disabled:opacity-30',
                            FOCUS
                        )}
                    >
                        Add habit
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
