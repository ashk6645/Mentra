'use client'

import { useCallback, useMemo, useState } from 'react'
import { ListChecks, Plus } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader, Reveal, Ring, Stat, StatGrid } from './primitives'
import { RoutineCard } from './routine-card'
import { RoutineDialog } from './routine-dialog'
import { useShortcuts, type Shortcut } from '@/lib/second-brain/use-shortcuts'
import { useSecondBrainData, useStoreReady } from '@/lib/second-brain/repo'
import { todayKey } from '@/lib/second-brain/date'
import { isRoutineScheduledOn, routineMinutes, routineProgress } from '@/lib/second-brain/domain/selectors'
import { TIME_OF_DAY_ORDER, type Routine } from '@/lib/second-brain/domain/types'

/**
 * Routines.
 *
 * A routine is an ordered checklist that resets each day. Each one is a card you
 * can run straight from the page; editing its steps is a mode on the card itself,
 * so the checklist you use every morning isn't cluttered with drag handles.
 */
export function RoutinesView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()

    const [editingId, setEditingId] = useState<string | null>(null)
    const [dialog, setDialog] = useState<{ open: boolean; routine: Routine | null; key: string }>({
        open: false, routine: null, key: 'new',
    })

    const today = todayKey()

    const routines = useMemo(
        () =>
            [...data.routines]
                // Today's first, then through the day.
                .sort(
                    (a, b) =>
                        Number(isRoutineScheduledOn(b, today)) - Number(isRoutineScheduledOn(a, today)) ||
                        TIME_OF_DAY_ORDER.indexOf(a.timeOfDay) - TIME_OF_DAY_ORDER.indexOf(b.timeOfDay) ||
                        a.sortOrder - b.sortOrder
                )
                .map(routine => ({
                    routine,
                    steps: data.routineSteps
                        .filter(s => s.routineId === routine.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder),
                    scheduledToday: isRoutineScheduledOn(routine, today),
                })),
        [data.routines, data.routineSteps, today]
    )

    const stats = useMemo(() => {
        const todays = routines.filter(r => r.scheduledToday)
        const steps = todays.flatMap(r => r.steps)
        const progress = routineProgress(steps, data.routineStepEntries, today)
        const finished = todays.filter(
            r => r.steps.length > 0 && routineProgress(r.steps, data.routineStepEntries, today).percent === 100
        ).length

        return { progress, count: todays.length, finished, minutes: routineMinutes(steps) }
    }, [routines, data.routineStepEntries, today])

    const openCreate = useCallback(() => setDialog({ open: true, routine: null, key: `new-${Date.now()}` }), [])

    const shortcuts = useMemo<Shortcut[]>(() => [
        { key: 'n', display: 'N', description: 'New routine', run: openCreate },
    ], [openCreate])

    useShortcuts(shortcuts, ready && !dialog.open)

    return (
        <>
            <Reveal index={0}>
                <PageHeader
                    title="Routines"
                    description="Short sequences you run without deciding. They reset every morning."
                    actions={<Button variant="primary" icon={Plus} kbd="N" onClick={openCreate}>New routine</Button>}
                />
            </Reveal>

            {ready && routines.length === 0 && (
                <Reveal index={1}>
                    <Card>
                        <EmptyState
                            icon={ListChecks}
                            title="No routines yet"
                            description="A morning start or an end-of-day shutdown — a few steps, in order, the same way each time."
                            action={<Button variant="primary" icon={Plus} onClick={openCreate}>New routine</Button>}
                        />
                    </Card>
                </Reveal>
            )}

            {ready && routines.length > 0 && (
                <>
                    <Reveal index={1}>
                        <StatGrid>
                            <Stat
                                label="Steps today"
                                value={stats.progress.done}
                                suffix={`/${stats.progress.expected}`}
                                detail={stats.progress.expected === 0 ? 'Nothing scheduled' : `${stats.progress.expected - stats.progress.done} left`}
                                visual={<Ring percent={stats.progress.percent} />}
                            />
                            <Stat
                                label="Routines today"
                                value={stats.finished}
                                suffix={`/${stats.count}`}
                                detail="finished"
                            />
                            <Stat
                                label="Planned time"
                                value={stats.minutes}
                                suffix=" min"
                                detail="across today’s routines"
                            />
                        </StatGrid>
                    </Reveal>

                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                        {routines.map(({ routine, steps, scheduledToday }, index) => (
                            <Reveal key={routine.id} index={2 + index}>
                                <RoutineCard
                                    routine={routine}
                                    steps={steps}
                                    entries={data.routineStepEntries}
                                    date={today}
                                    scheduledToday={scheduledToday}
                                    editing={editingId === routine.id}
                                    onEditingChange={editing => setEditingId(editing ? routine.id : null)}
                                    onEditDetails={() => setDialog({ open: true, routine, key: routine.id })}
                                />
                            </Reveal>
                        ))}
                    </div>
                </>
            )}

            <RoutineDialog
                key={dialog.key}
                open={dialog.open}
                onOpenChange={open => setDialog(prev => ({ ...prev, open }))}
                routine={dialog.routine}
            />
        </>
    )
}
