'use client'

import { memo, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Pencil, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from './checkbox'
import { ActionMenu } from './menu'
import { Button, Card, IconButton, Ring, Strike } from './primitives'
import { ItemIcon } from '@/lib/second-brain/icons'
import {
    addStep, deleteRoutine, deleteStep, reorderSteps, resetRoutine, toggleStep, updateStep,
} from '@/lib/second-brain/actions'
import { daysLabel, routineMinutes, routineProgress } from '@/lib/second-brain/domain/selectors'
import { TIME_OF_DAY_LABEL, type Routine, type RoutineStep, type RoutineStepEntry } from '@/lib/second-brain/domain/types'
import { DIVIDE, DONE, FIELD_FOCUS, FOCUS, HAIRLINE, HOVER, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

// ─── Checklist ───────────────────────────────────────────────────────────────

/** One tickable step. The whole row is the target, so it's easy on a phone. */
export const StepRow = memo(function StepRow({
    step,
    done,
    date,
    inset,
}: {
    step: RoutineStep
    done: boolean
    date: string
    /** Indent under a routine heading, as on the overview. */
    inset?: boolean
}) {
    return (
        <button
            type="button"
            onClick={() => toggleStep(step.id, date)}
            aria-pressed={done}
            className={cn(
                'group flex h-10 w-full items-center gap-3 pr-4 text-left', inset ? 'pl-11' : 'pl-4',
                HOVER, TRANSITION.fast, FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
            )}
        >
            <Checkbox checked={done} size="sm" />
            <Strike done={done} className={cn('min-w-0 flex-1', T.body)}>{step.title}</Strike>
            {step.estimatedMinutes !== null && (
                <span className={cn(T.meta, NUM, INK.subtle)}>{step.estimatedMinutes} min</span>
            )}
        </button>
    )
})

/** An inline "add a step" field that stays open for the next one. */
function AddStep({ routineId, inset }: { routineId: string; inset?: boolean }) {
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState('')

    if (!adding) {
        return (
            <button
                type="button"
                onClick={() => setAdding(true)}
                className={cn(
                    'flex h-10 w-full items-center gap-3 pr-4 text-left', inset ? 'pl-11' : 'pl-4',
                    T.body, INK.subtle, HOVER, TRANSITION.fast, 'hover:text-foreground',
                    FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
                )}
            >
                <span className="flex h-4 w-4 items-center justify-center">
                    <Plus className={ICON.md} strokeWidth={2} />
                </span>
                Add step
            </button>
        )
    }

    const commit = () => {
        addStep(routineId, draft)
        setDraft('')
    }

    return (
        <div className={cn('flex h-10 items-center gap-3 pr-2', inset ? 'pl-11' : 'pl-4')}>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <Plus className={cn(ICON.md, INK.subtle)} strokeWidth={2} />
            </span>
            <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') commit()
                    if (e.key === 'Escape') {
                        setDraft('')
                        setAdding(false)
                    }
                }}
                onBlur={() => {
                    commit()
                    setAdding(false)
                }}
                placeholder="Step, then Enter"
                aria-label="New step"
                maxLength={120}
                className={cn('min-w-0 flex-1 bg-transparent outline-none', T.body, INK.strong, 'placeholder:text-muted-foreground/55')}
            />
        </div>
    )
}

// ─── Editing ─────────────────────────────────────────────────────────────────

/** A step while the routine is being edited: drag, rename, estimate, remove. */
function EditRow({ step, onDragEnd }: { step: RoutineStep; onDragEnd: () => void }) {
    const controls = useDragControls()

    return (
        <Reorder.Item
            value={step.id}
            dragListener={false}
            dragControls={controls}
            onDragEnd={onDragEnd}
            className="relative flex h-11 items-center gap-2 bg-card pl-1.5 pr-2"
            whileDrag={{ scale: 1.01, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.18)', zIndex: 10 }}
        >
            <button
                type="button"
                onPointerDown={event => controls.start(event)}
                aria-label={`Reorder ${step.title}`}
                className={cn('flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing', R.md, INK.subtle, 'hover:text-foreground', FOCUS)}
            >
                <GripVertical className={ICON.md} strokeWidth={2} />
            </button>

            <input
                value={step.title}
                onChange={e => updateStep(step.id, { title: e.target.value })}
                aria-label="Step"
                maxLength={120}
                className={cn('h-8 min-w-0 flex-1 border border-transparent bg-transparent px-2', R.md, T.body, INK.strong, TRANSITION.fast, 'hover:border-black/[0.08] dark:hover:border-white/[0.08]', FIELD_FOCUS)}
            />

            <label className={cn('flex h-8 shrink-0 items-center gap-1 border px-2', R.md, HAIRLINE, TRANSITION.fast, 'focus-within:border-primary/50')}>
                <input
                    value={step.estimatedMinutes ?? ''}
                    onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
                        updateStep(step.id, { estimatedMinutes: digits === '' ? null : Number(digits) })
                    }}
                    inputMode="numeric"
                    placeholder="–"
                    aria-label={`Minutes for ${step.title}`}
                    className={cn('w-7 bg-transparent text-right outline-none', T.body, NUM, INK.strong, 'placeholder:text-muted-foreground/50')}
                />
                <span className={cn(T.meta, INK.subtle)}>min</span>
            </label>

            <IconButton icon={X} label={`Remove ${step.title}`} onClick={() => deleteStep(step)} />
        </Reorder.Item>
    )
}

function EditList({ steps }: { steps: RoutineStep[] }) {
    // Local order only while a drag is in flight; the store is written once, on drop.
    const [order, setOrder] = useState<string[] | null>(null)
    const ids = order ?? steps.map(s => s.id)
    const byId = new Map(steps.map(s => [s.id, s]))

    return (
        <Reorder.Group axis="y" values={ids} onReorder={setOrder} className={cn('divide-y', DIVIDE)}>
            {ids.map(id => {
                const step = byId.get(id)
                if (!step) return null
                return (
                    <EditRow
                        key={id}
                        step={step}
                        onDragEnd={() => {
                            if (order) reorderSteps(order)
                            setOrder(null)
                        }}
                    />
                )
            })}
        </Reorder.Group>
    )
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function RoutineCard({
    routine,
    steps,
    entries,
    date,
    scheduledToday,
    editing,
    onEditingChange,
    onEditDetails,
}: {
    routine: Routine
    steps: RoutineStep[]
    entries: RoutineStepEntry[]
    date: string
    scheduledToday: boolean
    editing: boolean
    onEditingChange: (editing: boolean) => void
    onEditDetails: () => void
}) {
    const progress = routineProgress(steps, entries, date)
    const minutes = routineMinutes(steps)
    const doneIds = new Set(entries.filter(e => e.date === date).map(e => e.stepId))

    const meta = [
        TIME_OF_DAY_LABEL[routine.timeOfDay],
        daysLabel(routine.days),
        minutes > 0 ? `~${minutes} min` : null,
    ].filter(Boolean).join(' · ')

    return (
        <Card>
            <header className={cn('flex items-center gap-3 border-b py-3 pl-4 pr-3', HAIRLINE)}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-black/[0.04] dark:bg-white/[0.06]">
                    <ItemIcon icon={routine.icon} className={cn(ICON.lg, INK.default)} />
                </span>

                <div className="min-w-0 flex-1">
                    <h2 className={cn(T.title, 'truncate', INK.strong)}>{routine.name}</h2>
                    <p className={cn(T.meta, 'truncate', INK.subtle)}>
                        {meta}
                        {!scheduledToday && <span> · Not today</span>}
                    </p>
                </div>

                {editing ? (
                    <Button size="sm" variant="primary" onClick={() => onEditingChange(false)}>Done</Button>
                ) : (
                    <div className="flex items-center gap-1">
                        {steps.length > 0 && (
                            <span className={cn('mr-1 flex items-center gap-2', T.meta, 'font-medium', NUM, progress.percent === 100 ? DONE.text : INK.muted)}>
                                {progress.done}/{progress.expected}
                                <Ring percent={progress.percent} size={18} stroke={2.5} />
                            </span>
                        )}
                        <ActionMenu
                            label={`${routine.name} actions`}
                            actions={[
                                { label: 'Edit steps', icon: Pencil, onSelect: () => onEditingChange(true) },
                                { label: 'Edit details', icon: Settings2, onSelect: onEditDetails },
                                ...(progress.done > 0
                                    ? [{ label: 'Clear today’s ticks', icon: RotateCcw, onSelect: () => resetRoutine(routine.id, date) }]
                                    : []),
                                { label: 'Delete routine', icon: Trash2, onSelect: () => deleteRoutine(routine), destructive: true, separated: true },
                            ]}
                        />
                    </div>
                )}
            </header>

            {editing ? (
                <EditList steps={steps} />
            ) : (
                <div className={cn('divide-y', DIVIDE)}>
                    {steps.map(step => (
                        <StepRow key={step.id} step={step} done={doneIds.has(step.id)} date={date} />
                    ))}
                </div>
            )}

            <div className={cn(steps.length > 0 && 'border-t', HAIRLINE)}>
                <AddStep routineId={routine.id} />
            </div>
        </Card>
    )
}
