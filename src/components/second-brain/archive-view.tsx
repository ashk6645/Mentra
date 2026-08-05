'use client'

import { useCallback, useMemo, useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Segmented } from './segmented'
import { useConfirm } from './confirm-dialog'
import { notifyWithUndo } from '@/lib/second-brain/feedback'
import { Panel, SectionHeader } from './primitives'
import { useSecondBrainData, useSecondBrainActions, useStoreReady } from '@/lib/second-brain/repo'
import { longDateLabel, toDateKey } from '@/lib/second-brain/date'
import type { CollectionName } from '@/lib/second-brain/domain/types'
import { FOCUS, HOVER, INK, R, ROW, T } from '@/lib/second-brain/ui'

/** Collections that support archiving, and what to call their contents. */
const ARCHIVABLE: { collection: CollectionName; label: string; singular: string }[] = [
    { collection: 'habits', label: 'Habits', singular: 'habit' },
    { collection: 'routines', label: 'Routines', singular: 'routine' },
    { collection: 'goals', label: 'Goals', singular: 'goal' },
    { collection: 'areas', label: 'Areas', singular: 'area' },
    { collection: 'learningItems', label: 'Learning', singular: 'topic' },
    { collection: 'resources', label: 'Resources', singular: 'resource' },
    { collection: 'mediaItems', label: 'Media', singular: 'item' },
    { collection: 'ideas', label: 'Ideas', singular: 'idea' },
]

interface ArchivedRecord {
    id: string
    title: string
    archivedAt: string
    collection: CollectionName
    label: string
}

/**
 * The archive.
 *
 * Everything that leaves an active list lands here rather than being destroyed —
 * a habit you stopped six months ago is still the explanation for a gap in the
 * heatmap, so deleting it would rewrite history. Permanent deletion exists but is
 * deliberately the harder of the two actions.
 */
export function ArchiveView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { update, replace } = useSecondBrainActions()

    const [filter, setFilter] = useState<'all' | CollectionName>('all')
    const { confirm, dialog } = useConfirm()

    const archived = useMemo(() => {
        const records: ArchivedRecord[] = []

        for (const { collection, label } of ARCHIVABLE) {
            for (const record of data[collection] as unknown[]) {
                const r = record as { id?: string; archivedAt?: string | null; name?: string; title?: string }
                if (!r.id || !r.archivedAt) continue

                records.push({
                    id: r.id,
                    // Areas and habits use `name`; everything else uses `title`.
                    title: r.name ?? r.title ?? 'Untitled',
                    archivedAt: r.archivedAt,
                    collection,
                    label,
                })
            }
        }

        return records.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
    }, [data])

    const visible = useMemo(
        () => (filter === 'all' ? archived : archived.filter(r => r.collection === filter)),
        [archived, filter]
    )

    /** Filter options, but only for collections that actually hold something. */
    const options = useMemo(() => {
        const present = new Set(archived.map(r => r.collection))
        return [
            { id: 'all' as const, label: 'All' },
            ...ARCHIVABLE.filter(a => present.has(a.collection)).map(a => ({
                id: a.collection,
                label: a.label,
            })),
        ]
    }, [archived])

    const restore = useCallback(
        (record: ArchivedRecord) => {
            // Snapshot the whole collection rather than remembering "it was
            // archived at T". Restoring the array puts the record back exactly as
            // it was, in its original position, with no field left behind.
            const snapshot = data[record.collection]

            update(record.collection, record.id, { archivedAt: null } as never)
            notifyWithUndo(`${record.title} restored.`, () =>
                replace(record.collection, snapshot as never)
            )
        },
        [data, update, replace]
    )

    const destroy = useCallback(
        async (record: ArchivedRecord) => {
            const confirmed = await confirm({
                title: `Delete ${record.title}?`,
                description:
                    'This removes it and its history for good. You will have a few seconds to undo.',
                confirmLabel: 'Delete',
                destructive: true,
            })
            if (!confirmed) return

            const snapshot = data[record.collection]

            replace(
                record.collection,
                (data[record.collection] as unknown[]).filter(
                    r => (r as { id?: string }).id !== record.id
                ) as never
            )

            notifyWithUndo(`${record.title} deleted.`, () =>
                replace(record.collection, snapshot as never)
            )
        },
        [data, replace, confirm]
    )

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-9 w-64 animate-pulse rounded-[8px] bg-foreground/[0.05]" />
                <div className="h-[200px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    if (archived.length === 0) {
        return (
            <Panel className="py-14 text-center">
                <p className={cn(T.body, INK.muted)}>Nothing archived.</p>
                <p className={cn('mx-auto mt-1.5 max-w-[340px]', T.label, INK.subtle)}>
                    Archiving takes something out of your active lists without destroying its
                    history — a habit you stopped still explains the gap in its own heatmap.
                </p>
            </Panel>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {dialog}

            {options.length > 2 && (
                <Segmented options={options} value={filter} onChange={setFilter} ariaLabel="Archive filter" />
            )}

            <SectionHeader title="Archived" count={visible.length} />

            <div className="flex flex-col">
                {visible.map(record => (
                    <div
                        key={`${record.collection}:${record.id}`}
                        className={cn(ROW, 'group flex-wrap')}
                    >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className={cn('truncate', T.body, INK.default)}>{record.title}</span>
                            <span className={cn('text-[11px]', INK.subtle)}>
                                {record.label} · archived {longDateLabel(toDateKey(new Date(record.archivedAt)))}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => restore(record)}
                            className={cn('flex items-center gap-1.5 px-2 py-1', R.sm, T.label, INK.muted,
                                'transition-colors hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                        >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                        </button>

                        {/* Destructive, so it stays quieter than restore and confirms. */}
                        <button
                            type="button"
                            onClick={() => destroy(record)}
                            aria-label={`Permanently delete ${record.title}`}
                            className={cn('flex h-7 w-7 shrink-0 items-center justify-center', R.sm, INK.subtle,
                                'opacity-50 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100',
                                'hover:text-red-600 dark:hover:text-red-400', FOCUS)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
