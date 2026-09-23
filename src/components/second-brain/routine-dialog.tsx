'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from './overlay'
import { Button } from './primitives'
import { Segmented } from './segmented'
import { DayPicker, Field, IconPicker, TextInput } from './fields'
import { saveRoutine } from '@/lib/second-brain/actions'
import { TIME_OF_DAY_LABEL, TIME_OF_DAY_ORDER, type Routine, type TimeOfDay } from '@/lib/second-brain/domain/types'
import { INK, T } from '@/lib/second-brain/ui'

const SCHEDULES = [
    { id: 'every' as const, label: 'Every day' },
    { id: 'some' as const, label: 'Specific days' },
]

const SLOTS = TIME_OF_DAY_ORDER.map(id => ({ id, label: TIME_OF_DAY_LABEL[id] }))

interface Form {
    name: string
    icon: string
    timeOfDay: TimeOfDay
    schedule: 'every' | 'some'
    days: number[]
}

/**
 * Create a routine, or change its name, icon and schedule. Steps are edited on
 * the routine itself, where you can see them.
 *
 * Mount with a `key` per routine so each opening starts from its values.
 */
export function RoutineDialog({
    open,
    onOpenChange,
    routine,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    routine: Routine | null
}) {
    const [form, setForm] = useState<Form>(() => ({
        name: routine?.name ?? '',
        icon: routine?.icon ?? 'sunrise',
        timeOfDay: routine?.timeOfDay ?? 'morning',
        schedule: routine && routine.days.length > 0 ? 'some' : 'every',
        days: routine && routine.days.length > 0 ? routine.days : [1, 2, 3, 4, 5],
    }))
    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(prev => ({ ...prev, [key]: value }))

    const valid = form.name.trim() !== '' && !(form.schedule === 'some' && form.days.length === 0)

    const submit = () => {
        if (!valid) return
        saveRoutine(
            { name: form.name, icon: form.icon, timeOfDay: form.timeOfDay, days: form.schedule === 'every' ? [] : form.days },
            routine?.id
        )
        onOpenChange(false)
    }

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title={routine ? 'Edit routine' : 'New routine'}
            description={routine ? undefined : 'A short sequence you run the same way each time.'}
            footer={
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="primary" onClick={submit} disabled={!valid} kbd="↵">
                        {routine ? 'Save' : 'Create routine'}
                    </Button>
                </div>
            }
        >
            <form
                className="flex flex-col gap-5"
                onSubmit={event => {
                    event.preventDefault()
                    submit()
                }}
            >
                <Field label="Name" htmlFor="routine-name">
                    <TextInput
                        id="routine-name"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="Morning start"
                        autoFocus
                        autoComplete="off"
                        maxLength={60}
                    />
                </Field>

                <Field label="Icon">
                    <IconPicker value={form.icon} onChange={icon => set('icon', icon)} />
                </Field>

                <Field label="Runs">
                    <Segmented options={SCHEDULES} value={form.schedule} onChange={s => set('schedule', s)} ariaLabel="Runs" fill />
                    {form.schedule === 'some' && (
                        <div className="flex flex-col gap-2">
                            <DayPicker value={form.days} onChange={days => set('days', days)} />
                            {form.days.length === 0 && <p className={cn(T.meta, INK.subtle)}>Pick at least one day.</p>}
                        </div>
                    )}
                </Field>

                <Field label="Time of day">
                    <Segmented options={SLOTS} value={form.timeOfDay} onChange={t => set('timeOfDay', t)} ariaLabel="Time of day" fill />
                </Field>

                <button type="submit" hidden aria-hidden tabIndex={-1} />
            </form>
        </Modal>
    )
}
