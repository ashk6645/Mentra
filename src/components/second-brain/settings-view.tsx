'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel, SectionHeader, StatusBadge } from './primitives'
import { useConfirm } from './confirm-dialog'
import { restoreIntro } from '@/lib/second-brain/repo/preferences'
import { notify, notifyError, notifyWithUndo } from '@/lib/second-brain/feedback'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, repository } from '@/lib/second-brain/repo'
import { emptyData, type CollectionName, type SecondBrainData } from '@/lib/second-brain/domain/types'
import { R, T, INK, NUM, FOCUS, HAIRLINE, LABEL } from '@/lib/second-brain/ui'

/** Human labels for the storage breakdown. */
const COLLECTION_LABEL: Partial<Record<CollectionName, string>> = {
    areas: 'Areas', goals: 'Goals', milestones: 'Milestones',
    habits: 'Habits', habitEntries: 'Habit entries',
    routines: 'Routines', routineSteps: 'Routine steps', routineStepEntries: 'Routine completions',
    exercises: 'Exercises', workoutTemplates: 'Workout templates',
    workouts: 'Workouts', workoutSets: 'Sets',
    learningItems: 'Learning topics', studySessions: 'Study sessions',
    resources: 'Resources', mediaItems: 'Media', ideas: 'Ideas',
    journalEntries: 'Journal entries', reviews: 'Reviews', transactions: 'Transactions',
}

/**
 * Settings.
 *
 * Deliberately small — spec §62 warns against building a settings application.
 * What is here is what genuinely has nowhere else to live: an honest statement of
 * where the data is, and the ability to get it out.
 *
 * Export/import matters more than it looks. Everything lives in one browser's
 * localStorage, so without a way to move it, clearing site data destroys months
 * of history with no warning. This is the backup story until a backend exists.
 */
export function SettingsView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { reset } = useSecondBrainActions()

    const fileInput = useRef<HTMLInputElement>(null)
    const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
    const { confirm, dialog } = useConfirm()

    const counts = useMemo(() => {
        const entries = (Object.keys(emptyData()) as CollectionName[])
            .map(collection => ({
                collection,
                label: COLLECTION_LABEL[collection] ?? collection,
                count: (data[collection] as unknown[]).length,
            }))
            .filter(entry => entry.count > 0)
            .sort((a, b) => b.count - a.count)

        const total = entries.reduce((sum, e) => sum + e.count, 0)
        return { entries, total }
    }, [data])

    const approximateBytes = useMemo(() => JSON.stringify(data).length, [data])

    const exportData = useCallback(() => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        // Date is stamped at click time rather than render, so a page left open
        // overnight doesn't produce a file named for yesterday.
        link.download = `second-brain-${new Date().toISOString().slice(0, 10)}.json`
        link.click()

        URL.revokeObjectURL(url)
        setMessage({ tone: 'success', text: 'Exported.' })
        notify('Exported.')
    }, [data])

    const importData = useCallback(async (file: File) => {
        try {
            const parsed = JSON.parse(await file.text()) as Partial<SecondBrainData>

            // Validate before replacing anything. A malformed import that half-
            // applies is worse than one that is refused.
            const known = Object.keys(emptyData()) as CollectionName[]
            const usable = known.filter(key => Array.isArray(parsed[key]))

            if (usable.length === 0) {
                setMessage({ tone: 'danger', text: 'That file does not look like a Second Brain export.' })
                notifyError('That file does not look like a Second Brain export.')
                return
            }

            for (const key of known) {
                repository.replace(key, (parsed[key] ?? []) as never)
            }

            setMessage({ tone: 'success', text: `Imported ${usable.length} collections.` })
            notify(`Imported ${usable.length} collections.`)
        } catch {
            setMessage({ tone: 'danger', text: 'Could not read that file.' })
            notifyError('Could not read that file.')
        }
    }, [])

    if (!ready) {
        return <div className="h-[320px] animate-pulse rounded-[12px] bg-foreground/[0.04]" aria-busy />
    }

    return (
        <div className="flex flex-col gap-8">
            {dialog}

            {/* Where the data lives — stated plainly rather than left to be discovered. */}
            <section>
                <SectionHeader title="Storage" />
                <Panel className="flex flex-col gap-4">
                    <p className={cn(T.body, INK.muted)}>
                        Second Brain keeps everything in this browser. Nothing is sent to a server,
                        which also means nothing syncs between devices and clearing site data
                        removes it. Export regularly if the history matters to you.
                    </p>

                    <div className={cn('flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-[11px]', HAIRLINE, NUM, INK.subtle)}>
                        <span>{counts.total.toLocaleString()} records</span>
                        <span>{Math.round(approximateBytes / 1024)} KB</span>
                        <span>{counts.entries.length} collections in use</span>
                    </div>
                </Panel>
            </section>

            <section>
                <SectionHeader title="Your data" />
                <Panel className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={exportData}
                            className={cn('flex items-center gap-1.5 px-3 py-2', R.md, T.button,
                                'bg-foreground text-background transition-opacity hover:opacity-90', FOCUS)}
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInput.current?.click()}
                            className={cn('flex items-center gap-1.5 border px-3 py-2', R.md, T.button,
                                INK.default, HAIRLINE, 'transition-colors hover:bg-foreground/[0.04]', FOCUS)}
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Import
                        </button>

                        <input
                            ref={fileInput}
                            type="file"
                            accept="application/json,.json"
                            className="sr-only"
                            aria-label="Import a Second Brain export"
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) importData(file)
                                // Reset so re-picking the same file fires change again.
                                e.target.value = ''
                            }}
                        />

                        <button
                            type="button"
                            onClick={async () => {
                                const confirmed = await confirm({
                                    title: 'Reset to the demo data?',
                                    description:
                                        'Everything you have recorded is replaced. Export first if you want to keep it.',
                                    confirmLabel: 'Reset',
                                    destructive: true,
                                })
                                if (!confirmed) return

                                // Snapshot before resetting so undo is real rather
                                // than a button that apologises.
                                const previous = data

                                reset()
                                setMessage({ tone: 'success', text: 'Reset to the demo data.' })
                                notifyWithUndo('Reset to the demo data.', () => {
                                    for (const key of Object.keys(emptyData()) as CollectionName[]) {
                                        repository.replace(key, previous[key] as never)
                                    }
                                })
                            }}
                            className={cn('ml-auto flex items-center gap-1.5 px-3 py-2', R.md, T.button, INK.muted,
                                'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset demo
                        </button>
                    </div>

                    {message && (
                        <StatusBadge tone={message.tone === 'success' ? 'success' : 'danger'}>
                            {message.text}
                        </StatusBadge>
                    )}

                    <p className={cn('text-[11px]', INK.subtle)}>
                        Import replaces everything. Export first if you are not sure.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            restoreIntro()
                            notify('The introduction will show on the home screen again.')
                        }}
                        className={cn('self-start text-[11px] underline underline-offset-2', INK.subtle,
                            'transition-colors hover:text-foreground', FOCUS)}
                    >
                        Show the introduction again
                    </button>
                </Panel>
            </section>

            <section>
                <SectionHeader title="What is stored" count={counts.entries.length} />
                <Panel className="flex flex-col gap-2">
                    {counts.entries.map(entry => (
                        <div key={entry.collection} className="flex items-baseline justify-between gap-3">
                            <span className={cn(T.body, INK.default)}>{entry.label}</span>
                            <span className={cn('text-[11px]', NUM, INK.muted)}>
                                {entry.count.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </Panel>
            </section>

            <section>
                <SectionHeader title="Preferences" />
                <Panel>
                    <p className={cn(T.body, INK.muted)}>
                        Theme and week start are set in Mentra&rsquo;s own settings and apply here too.
                    </p>
                    <p className={cn('mt-2', LABEL)}>One app, one set of preferences.</p>
                </Panel>
            </section>
        </div>
    )
}
