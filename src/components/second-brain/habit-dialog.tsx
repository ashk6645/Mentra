'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from './overlay'
import { Button } from './primitives'
import { Segmented } from './segmented'
import { DayPicker, Field, IconPicker, Stepper, TextInput } from './fields'
import { deleteHabit, saveHabit, type HabitDraft } from '@/lib/second-brain/actions'
import { DEFAULT_ICON } from '@/lib/second-brain/icons'
import { TIME_OF_DAY_LABEL, TIME_OF_DAY_ORDER, type Habit, type TimeOfDay } from '@/lib/second-brain/domain/types'
import { INK, T } from '@/lib/second-brain/ui'

type Cadence = 'daily' | 'weekdays' | 'weekly_count'

const CADENCES = [
    { id: 'daily' as const, label: 'Every day' },
    { id: 'weekdays' as const, label: 'Specific days' },
    { id: 'weekly_count' as const, label: 'Times a week' },
]

const SLOTS = TIME_OF_DAY_ORDER.map(id => ({ id, label: TIME_OF_DAY_LABEL[id] }))

interface Form {
    name: string
    icon: string
    cadence: Cadence
    days: number[]
    timesPerWeek: number
    timeOfDay: TimeOfDay
}

function formFor(habit: Habit | null): Form {
    const f = habit?.frequency
    return {
        name: habit?.name ?? '',
        icon: habit?.icon ?? DEFAULT_ICON,
        cadence: f?.kind ?? 'daily',
        days: f?.kind === 'weekdays' ? f.days : [1, 2, 3, 4, 5],
        timesPerWeek: f?.kind === 'weekly_count' ? f.timesPerWeek : 3,
        timeOfDay: habit?.timeOfDay ?? 'morning',
    }
}

function toDraft(form: Form): HabitDraft {
    return {
        name: form.name,
        icon: form.icon,
        timeOfDay: form.timeOfDay,
        frequency:
            form.cadence === 'weekdays'
                ? form.days.length === 7 ? { kind: 'daily' } : { kind: 'weekdays', days: [...form.days].sort((a, b) => a - b) }
                : form.cadence === 'weekly_count'
                    ? { kind: 'weekly_count', timesPerWeek: form.timesPerWeek }
                    : { kind: 'daily' },
    }
}

/**
 * Create or edit a habit.
 *
 * Mount it with a `key` per habit (or "new") so each opening starts from that
 * habit's values — state initialised from props, never synced into it.
 */
export function HabitDialog({
    open,
    onOpenChange,
    habit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Null to create. */
    habit: Habit | null
}) {
    const [form, setForm] = useState(() => formFor(habit))
    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(prev => ({ ...prev, [key]: value }))

    const valid = form.name.trim() !== '' && !(form.cadence === 'weekdays' && form.days.length === 0)

    const submit = () => {
        if (!valid) return
        saveHabit(toDraft(form), habit?.id)
        onOpenChange(false)
    }

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title={habit ? 'Edit habit' : 'New habit'}
            description={habit ? undefined : 'Something you want to do again and again.'}
            footer={
                <>
                    {habit && (
                        <Button
                            variant="danger"
                            icon={Trash2}
                            onClick={() => {
                                onOpenChange(false)
                                deleteHabit(habit)
                            }}
                        >
                            Delete
                        </Button>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button variant="primary" onClick={submit} disabled={!valid} kbd="↵">
                            {habit ? 'Save' : 'Create habit'}
                        </Button>
                    </div>
                </>
            }
        >
            <form
                className="flex flex-col gap-5"
                onSubmit={event => {
                    event.preventDefault()
                    submit()
                }}
            >
                <Field label="Name" htmlFor="habit-name">
                    <TextInput
                        id="habit-name"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="Read 20 pages"
                        autoFocus
                        autoComplete="off"
                        maxLength={80}
                    />
                </Field>

                <Field label="Icon">
                    <IconPicker value={form.icon} onChange={icon => set('icon', icon)} />
                </Field>

                <Field label="Repeat">
                    <Segmented options={CADENCES} value={form.cadence} onChange={c => set('cadence', c)} ariaLabel="Repeat" fill />

                    {form.cadence === 'weekdays' && (
                        <div className="flex flex-col gap-2">
                            <DayPicker value={form.days} onChange={days => set('days', days)} />
                            {form.days.length === 0 && (
                                <p className={cn(T.meta, INK.subtle)}>Pick at least one day.</p>
                            )}
                        </div>
                    )}

                    {form.cadence === 'weekly_count' && (
                        <div className="flex items-center gap-3">
                            <Stepper
                                value={form.timesPerWeek}
                                onChange={n => set('timesPerWeek', n)}
                                min={1}
                                max={6}
                                label="Times a week"
                            />
                            <span className={cn(T.meta, INK.muted)}>times a week, any days</span>
                        </div>
                    )}
                </Field>

                <Field label="Time of day">
                    <Segmented options={SLOTS} value={form.timeOfDay} onChange={t => set('timeOfDay', t)} ariaLabel="Time of day" fill />
                </Field>

                {/* Lets Enter submit from any field. */}
                <button type="submit" hidden aria-hidden tabIndex={-1} />
            </form>
        </Modal>
    )
}
