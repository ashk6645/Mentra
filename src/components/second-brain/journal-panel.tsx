'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Panel } from './primitives'
import { createId } from '@/lib/second-brain/repo'
import type { JournalEntry, DayKey, SecondBrainData, CollectionName } from '@/lib/second-brain/domain/types'
import { R, T, INK, LABEL, FOCUS, HAIRLINE } from '@/lib/second-brain/ui'

interface JournalPanelProps {
    date: DayKey
    entry: JournalEntry | null
    onCreate: <K extends CollectionName>(collection: K, record: SecondBrainData[K][number]) => unknown
    onUpdate: <K extends CollectionName>(
        collection: K,
        id: string,
        patch: Partial<SecondBrainData[K][number]>
    ) => void
}

/** 1-5 scales, rendered as a row rather than a dropdown — one tap, no menu. */
function Scale({
    label,
    value,
    max = 5,
    onChange,
}: {
    label: string
    value: number | null
    max?: number
    onChange: (value: number | null) => void
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className={LABEL}>{label}</span>
            <div className="flex gap-px overflow-hidden">
                {Array.from({ length: max }, (_, i) => i + 1).map(n => (
                    <button
                        key={n}
                        type="button"
                        // Tapping the current value clears it — otherwise a mis-tap
                        // is permanent and the field can never return to "unset".
                        onClick={() => onChange(value === n ? null : n)}
                        aria-label={`${label} ${n} of ${max}`}
                        aria-pressed={value === n}
                        /*
                         * No border on the unselected state. Outlining every cell
                         * turned mood, energy and the ten-point day rating into
                         * twenty separate boxes — a survey form rather than a
                         * control. A shared fill reads as one track you fill up.
                         */
                        className={cn(
                            'h-6 w-[26px] text-[11px] font-medium tabular-nums transition-colors',
                            'first:rounded-l-[6px] last:rounded-r-[6px]', FOCUS,
                            value !== null && n <= value
                                ? 'bg-foreground text-background'
                                : cn('bg-foreground/[0.05]', INK.subtle, 'hover:bg-foreground/[0.09]')
                        )}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    )
}

/** Auto-growing textarea — a fixed-height box makes long reflection feel unwelcome. */
function Field({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string
    value: string
    placeholder: string
    onChange: (value: string) => void
}) {
    const ref = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const node = ref.current
        if (!node) return
        node.style.height = 'auto'
        node.style.height = `${node.scrollHeight}px`
    }, [value])

    return (
        <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{label}</span>
            <textarea
                ref={ref}
                rows={1}
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    // `overflow-hidden` because the field grows to fit its content —
                    // without it the browser reserved a scrollbar track and drew a
                    // pale bar down the inside edge of every box.
                    'w-full resize-none overflow-hidden border bg-transparent px-2.5 py-2',
                    R.md, T.body, HAIRLINE,
                    'placeholder:text-muted-foreground/50',
                    'outline-none transition-colors focus:border-primary/40'
                )}
            />
        </label>
    )
}

/**
 * Daily reflection.
 *
 * Every field is optional, and the entry is only created once something is
 * actually written — so browsing past days doesn't litter storage with empty
 * rows, and the journal list reflects days you reflected on rather than days you
 * happened to open.
 */
export function JournalPanel({ date, entry, onCreate, onUpdate }: JournalPanelProps) {
    /*
     * Local draft so typing stays responsive; the store is still told about every
     * change, so there is one source of truth. The repository coalesces the
     * resulting writes, so a burst of typing costs one save rather than one per
     * keystroke.
     *
     * The parent keys this component by date, so changing day remounts it and the
     * draft resets naturally. An effect that cleared state on a date change would
     * work too, but setState-in-effect costs an extra render pass and the React
     * Compiler flags it.
     */
    const [draft, setDraft] = useState<Partial<JournalEntry>>({})

    const current = { ...entry, ...draft } as Partial<JournalEntry>

    const write = <K extends keyof JournalEntry>(field: K, value: JournalEntry[K]) => {
        setDraft(prev => ({ ...prev, [field]: value }))

        if (entry) {
            onUpdate('journalEntries', entry.id, { [field]: value } as Partial<JournalEntry>)
            return
        }

        const stamp = new Date().toISOString()
        onCreate('journalEntries', {
            id: createId('journal'),
            createdAt: stamp,
            updatedAt: stamp,
            date,
            mood: null, energy: null, intention: '', biggestWin: '',
            wentWell: '', couldImprove: '', learned: '', gratitude: '',
            tomorrowPriority: '', dayRating: null, freeform: '',
            [field]: value,
        } as JournalEntry)
    }

    return (
        <Panel className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Scale label="Mood" value={current.mood ?? null} onChange={v => write('mood', v)} />
                <Scale label="Energy" value={current.energy ?? null} onChange={v => write('energy', v)} />
            </div>

            <div className={cn('border-t', HAIRLINE)} />

            <div className="flex flex-col gap-4">
                <Field
                    label="Biggest win"
                    value={current.biggestWin ?? ''}
                    placeholder="What actually moved today?"
                    onChange={v => write('biggestWin', v)}
                />
                <Field
                    label="What could improve"
                    value={current.couldImprove ?? ''}
                    placeholder="Be specific, not harsh."
                    onChange={v => write('couldImprove', v)}
                />
                <Field
                    label="Tomorrow's priority"
                    value={current.tomorrowPriority ?? ''}
                    placeholder="One thing."
                    onChange={v => write('tomorrowPriority', v)}
                />
            </div>

            <div className={cn('border-t', HAIRLINE)} />

            <Scale
                label="Day rating"
                max={10}
                value={current.dayRating ?? null}
                onChange={v => write('dayRating', v)}
            />
        </Panel>
    )
}
