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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TIME_OF_DAY_ORDER, TIME_OF_DAY_LABEL, type TimeOfDay } from '@/lib/second-brain/types'

/** Sunday-first to match JS weekday numbering, which is what we store. */
const WEEKDAYS = [
    { value: 0, label: 'S', full: 'Sunday' },
    { value: 1, label: 'M', full: 'Monday' },
    { value: 2, label: 'T', full: 'Tuesday' },
    { value: 3, label: 'W', full: 'Wednesday' },
    { value: 4, label: 'T', full: 'Thursday' },
    { value: 5, label: 'F', full: 'Friday' },
    { value: 6, label: 'S', full: 'Saturday' },
]

const ICON_CHOICES = ['🏋️', '📚', '📖', '🎯', '🧘', '🏃', '💧', '🌙', '✍️', '🎧', '🥗', '💻']

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

export function AddHabitDialog({ open, onOpenChange, onAdd }: AddHabitDialogProps) {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState(ICON_CHOICES[0])
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
    const [days, setDays] = useState<number[]>([])

    const reset = () => {
        setName('')
        setIcon(ICON_CHOICES[0])
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
        setDays(prev =>
            prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
        )

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>New habit</DialogTitle>
                    <DialogDescription>
                        Something you repeat. Leave the days unselected for every day.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="habit-name">Name</Label>
                        <Input
                            id="habit-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                            placeholder="Morning run"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Icon</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {ICON_CHOICES.map(choice => (
                                <button
                                    key={choice}
                                    type="button"
                                    onClick={() => setIcon(choice)}
                                    aria-label={`Icon ${choice}`}
                                    aria-pressed={icon === choice}
                                    className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors',
                                        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                        icon === choice
                                            ? 'border-foreground/30 bg-neutral-100 dark:bg-neutral-800'
                                            : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                                    )}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Time of day</Label>
                        <div className="flex gap-1.5">
                            {TIME_OF_DAY_ORDER.map(slot => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setTimeOfDay(slot)}
                                    aria-pressed={timeOfDay === slot}
                                    className={cn(
                                        'flex-1 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors',
                                        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                        timeOfDay === slot
                                            ? 'border-foreground/30 bg-neutral-100 dark:bg-neutral-800'
                                            : 'border-neutral-200 text-muted-foreground hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60'
                                    )}
                                >
                                    {TIME_OF_DAY_LABEL[slot]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>
                            Repeat on{' '}
                            <span className="font-normal text-muted-foreground">
                                {days.length === 0 ? '— every day' : ''}
                            </span>
                        </Label>
                        <div className="flex gap-1.5">
                            {WEEKDAYS.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    aria-label={day.full}
                                    aria-pressed={days.includes(day.value)}
                                    className={cn(
                                        'flex h-9 flex-1 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors',
                                        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                        days.includes(day.value)
                                            ? 'border-transparent bg-primary text-primary-foreground'
                                            : 'border-neutral-200 text-muted-foreground hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60'
                                    )}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => close(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!name.trim()}>
                        Add habit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
