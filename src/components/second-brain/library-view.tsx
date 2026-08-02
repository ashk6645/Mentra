'use client'

import { useCallback, useMemo, useState } from 'react'
import { ExternalLink, Lightbulb, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Segmented } from './segmented'
import { Panel, SectionHeader, StatusBadge, ProgressBar } from './primitives'
import { notifyWithUndo } from '@/lib/second-brain/feedback'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { todayKey } from '@/lib/second-brain/date'
import type { ResourceStatus, MediaStatus, IdeaStatus } from '@/lib/second-brain/domain/types'
import { R, T, INK, NUM, FOCUS, HOVER, HAIRLINE } from '@/lib/second-brain/ui'

type Tab = 'resources' | 'media' | 'ideas'

const TABS = [
    { id: 'resources' as const, label: 'Resources' },
    { id: 'media' as const, label: 'Books & media' },
    { id: 'ideas' as const, label: 'Ideas' },
]

/*
 * Status is a category, not an alert.
 *
 * "Reading" in blue and "Promising" in amber colour-coded ordinary categories with
 * alert semantics, which put four different hues in a four-row list and left the
 * palette with nothing distinctive to say. Only the finished states keep the
 * accent, so green continues to mean the one thing it means everywhere else.
 */
const RESOURCE_STATUS: Record<ResourceStatus, { label: string; tone: 'neutral' | 'success' }> = {
    inbox: { label: 'Inbox', tone: 'neutral' },
    to_consume: { label: 'To read', tone: 'neutral' },
    consuming: { label: 'Reading', tone: 'neutral' },
    finished: { label: 'Finished', tone: 'success' },
    reference: { label: 'Reference', tone: 'neutral' },
}

const MEDIA_STATUS: Record<MediaStatus, { label: string; tone: 'neutral' | 'success' }> = {
    want: { label: 'Want', tone: 'neutral' },
    in_progress: { label: 'Reading', tone: 'neutral' },
    completed: { label: 'Finished', tone: 'success' },
    dropped: { label: 'Dropped', tone: 'neutral' },
}

const IDEA_STATUS: Record<IdeaStatus, { label: string; tone: 'neutral' | 'success' }> = {
    raw: { label: 'Raw', tone: 'neutral' },
    exploring: { label: 'Exploring', tone: 'neutral' },
    promising: { label: 'Promising', tone: 'neutral' },
    planned: { label: 'Planned', tone: 'neutral' },
    converted: { label: 'Converted', tone: 'success' },
}

/**
 * A rating, shown as five ticks rather than five gold stars.
 *
 * Amber stars are an e-commerce review widget. They pull more attention than a
 * subjective score deserves, and they were the loudest colour on a page whose
 * whole job is to be quiet. Monochrome ticks carry the same five-point scale at a
 * fraction of the visual cost, and let the one accent in the palette keep meaning
 * "done" rather than competing with "I liked this".
 */
function Rating({ value }: { value: number | null }) {
    if (value === null) return null

    return (
        <span className="flex items-center gap-[3px]" aria-label={`Rated ${value} of 5`}>
            {[1, 2, 3, 4, 5].map(n => (
                <span
                    key={n}
                    className={cn(
                        'h-[3px] w-[7px] rounded-full transition-colors',
                        n <= value ? 'bg-foreground/50' : 'bg-foreground/[0.12]'
                    )}
                />
            ))}
        </span>
    )
}

/**
 * The library: reference material, media and unstructured ideas.
 *
 * One page with three tabs rather than three nav entries. They share the same
 * shape — a filterable collection with a status — and spec §4 warns against a
 * sprawling nav. Splitting them would have added three top-level destinations
 * for what is one mental activity: "things I've collected".
 */
export function LibraryView() {
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create, update, replace } = useSecondBrainActions()

    const [tab, setTab] = useState<Tab>('resources')
    const [query, setQuery] = useState('')

    const today = todayKey()
    const matches = useCallback(
        (...fields: string[]) =>
            query.trim() === '' ||
            fields.some(f => f.toLowerCase().includes(query.trim().toLowerCase())),
        [query]
    )

    const resources = useMemo(
        () => data.resources.filter(r => r.archivedAt === null && matches(r.title, r.notes, r.type)),
        [data.resources, matches]
    )
    const media = useMemo(
        () => data.mediaItems.filter(m => m.archivedAt === null && matches(m.title, m.creator, m.keyIdeas)),
        [data.mediaItems, matches]
    )
    const ideas = useMemo(
        () =>
            data.ideas
                .filter(i => i.archivedAt === null && matches(i.title, i.description))
                // Highest potential for least effort first — the whole point of
                // scoring both is to make the list triage itself.
                .sort((a, b) => (b.potential - b.effort) - (a.potential - a.effort)),
        [data.ideas, matches]
    )

    const stamp = () => new Date().toISOString()

    const addResource = useCallback(() => {
        const s = stamp()
        create('resources', {
            id: createId('res'), createdAt: s, updatedAt: s, archivedAt: null,
            title: 'New resource', url: '', type: 'article', status: 'inbox',
            areaId: null, notes: '', rating: null,
        })
    }, [create])

    const addMedia = useCallback(() => {
        const s = stamp()
        create('mediaItems', {
            id: createId('media'), createdAt: s, updatedAt: s, archivedAt: null,
            title: 'New book', type: 'book', status: 'want', creator: '',
            progress: 0, startedAt: null, finishedAt: null, rating: null, keyIdeas: '',
        })
    }, [create])

    const addIdea = useCallback(() => {
        const s = stamp()
        create('ideas', {
            id: createId('idea'), createdAt: s, updatedAt: s, archivedAt: null,
            title: 'New idea', description: '', areaId: null,
            status: 'raw', potential: 3, effort: 3,
        })
    }, [create])

    /**
     * Promote an idea into a goal.
     *
     * Spec §23 asks for conversion, and a goal is the honest target — Mentra's
     * projects live in Postgres and this store cannot write there. The idea is
     * marked converted rather than deleted so the vault keeps its history.
     */
    const convertIdea = useCallback(
        (ideaId: string, title: string, description: string, areaId: string | null) => {
            const s = stamp()
            const target = new Date()
            target.setMonth(target.getMonth() + 3)

            create('goals', {
                id: createId('goal'), createdAt: s, updatedAt: s, archivedAt: null,
                title,
                why: description,
                horizon: 'quarterly', status: 'not_started', areaId,
                startDate: today,
                targetDate: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`,
                metric: null, target: null, current: 0,
            })

            update('ideas', ideaId, { status: 'converted' })
        },
        [create, update, today]
    )

    const archive = useCallback(
        (collection: 'resources' | 'mediaItems' | 'ideas', id: string) => {
            const snapshot = data[collection]
            const title = (snapshot as { id: string; title: string }[])
                .find(r => r.id === id)?.title ?? 'Item'

            update(collection, id, { archivedAt: new Date().toISOString() })
            notifyWithUndo(`${title} archived.`, () => replace(collection, snapshot as never))
        },
        [data, update, replace]
    )

    if (!ready) {
        return (
            <div className="flex flex-col gap-4" aria-busy>
                <div className="h-9 w-64 animate-pulse rounded-[8px] bg-foreground/[0.05]" />
                <div className="h-[300px] animate-pulse rounded-[12px] bg-foreground/[0.04]" />
            </div>
        )
    }

    const count = tab === 'resources' ? resources.length : tab === 'media' ? media.length : ideas.length
    const add = tab === 'resources' ? addResource : tab === 'media' ? addMedia : addIdea

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented options={TABS} value={tab} onChange={setTab} ariaLabel="Library section" />

                <div className="flex items-center gap-2">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search…"
                        aria-label="Search the library"
                        className={cn('w-40 border bg-transparent px-2.5 py-1.5', R.md, T.body, HAIRLINE,
                            'placeholder:text-muted-foreground/50 outline-none focus:border-primary/40')}
                    />
                    <button
                        type="button"
                        onClick={add}
                        // Label is hidden below `sm`; keep the accessible name.
                        aria-label="New item"
                        className={cn('flex items-center gap-1.5 border px-2.5 py-1.5', R.md, T.button,
                            INK.strong, HAIRLINE, 'transition-colors hover:bg-foreground/[0.04]', FOCUS)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </div>
            </div>

            <SectionHeader title={TABS.find(t => t.id === tab)!.label} count={count} />

            {count === 0 && (
                <Panel className="py-12 text-center">
                    <p className={cn(T.body, INK.muted)}>
                        {query ? 'Nothing matches that search.' : 'Nothing here yet.'}
                    </p>
                </Panel>
            )}

            {/* Resources */}
            {tab === 'resources' && resources.length > 0 && (
                <div className="flex flex-col">
                    {resources.map(resource => {
                        const status = RESOURCE_STATUS[resource.status]
                        return (
                            <div key={resource.id} className={cn('group flex flex-wrap items-center gap-3 px-2 py-2.5', R.md, HOVER)}>
                                <input
                                    value={resource.title}
                                    onChange={e => update('resources', resource.id, { title: e.target.value })}
                                    aria-label="Resource title"
                                    className={cn('min-w-0 flex-1 bg-transparent outline-none', T.body, INK.strong,
                                        R.sm, '-mx-1 px-1 focus:bg-foreground/[0.04]')}
                                />

                                <span className={cn('shrink-0 text-[11px] capitalize', INK.subtle)}>{resource.type}</span>
                                <Rating value={resource.rating} />
                                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>

                                {resource.url && (
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Open ${resource.title}`}
                                        className={cn('flex h-7 w-7 shrink-0 items-center justify-center', R.sm, INK.muted,
                                            'hover:bg-foreground/[0.06] hover:text-foreground', FOCUS)}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => archive('resources', resource.id)}
                                    className={cn('shrink-0 px-2 py-1 text-[11px]', R.sm, INK.subtle,
                                        // Touch has no hover, so a hover-only Archive is unreachable on a phone.
                                        'opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100',
                                        'hover:text-foreground', FOCUS)}
                                >
                                    Archive
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Books & media */}
            {tab === 'media' && media.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {media.map(item => {
                        const status = MEDIA_STATUS[item.status]
                        // Progress is a book concept — spec §22 warns against forcing
                        // book fields onto film and series.
                        const showsProgress = item.type === 'book' && item.progress !== null

                        return (
                            <Panel key={item.id} className="flex flex-col gap-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <input
                                        value={item.title}
                                        onChange={e => update('mediaItems', item.id, { title: e.target.value })}
                                        aria-label="Title"
                                        className={cn('min-w-0 flex-1 bg-transparent outline-none', T.title, INK.strong,
                                            R.sm, '-mx-1 px-1 focus:bg-foreground/[0.04]')}
                                    />
                                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                                </div>

                                <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]', INK.subtle)}>
                                    <span className="capitalize">{item.type}</span>
                                    {item.creator && <span>{item.creator}</span>}
                                    <Rating value={item.rating} />
                                </div>

                                {showsProgress && (
                                    <div className="flex items-center gap-3">
                                        <ProgressBar percent={item.progress!} className="flex-1" />
                                        <span className={cn('w-8 shrink-0 text-right text-[11px]', NUM, INK.muted)}>
                                            {item.progress}%
                                        </span>
                                    </div>
                                )}

                                {item.keyIdeas && (
                                    <p className={cn('text-[12px] leading-[1.5]', INK.muted)}>{item.keyIdeas}</p>
                                )}
                            </Panel>
                        )
                    })}
                </div>
            )}

            {/* Ideas */}
            {tab === 'ideas' && ideas.length > 0 && (
                <div className="flex flex-col gap-3">
                    {ideas.map(idea => {
                        const status = IDEA_STATUS[idea.status]
                        return (
                            <Panel key={idea.id} className="flex flex-col gap-2.5">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-foreground/45" strokeWidth={1.75} />
                                        <input
                                            value={idea.title}
                                            onChange={e => update('ideas', idea.id, { title: e.target.value })}
                                            aria-label="Idea title"
                                            className={cn('min-w-0 flex-1 bg-transparent outline-none', T.title, INK.strong,
                                                R.sm, '-mx-1 px-1 focus:bg-foreground/[0.04]')}
                                        />
                                    </div>
                                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                                </div>

                                {idea.description && (
                                    <p className={cn('text-[12.5px] leading-[1.5]', INK.muted)}>{idea.description}</p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className={cn('flex gap-4 text-[11px]', NUM, INK.subtle)}>
                                        <span>Potential {idea.potential}/5</span>
                                        <span>Effort {idea.effort}/5</span>
                                    </div>

                                    {idea.status !== 'converted' && (
                                        <button
                                            type="button"
                                            onClick={() => convertIdea(idea.id, idea.title, idea.description, idea.areaId)}
                                            className={cn('px-2.5 py-1 text-[11.5px] font-medium', R.sm,
                                                'border', HAIRLINE, INK.default,
                                                'transition-colors hover:bg-foreground/[0.05]', FOCUS)}
                                        >
                                            Make it a goal
                                        </button>
                                    )}
                                </div>
                            </Panel>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
