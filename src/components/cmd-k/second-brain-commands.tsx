'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Lightbulb, Search } from 'lucide-react'
import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'
import { useSecondBrainData, useSecondBrainActions, useStoreReady, createId } from '@/lib/second-brain/repo'
import { searchSecondBrain } from '@/lib/second-brain/domain/selectors'

/**
 * Second Brain results inside the app's existing ⌘K palette.
 *
 * Deliberately not a second palette. Mentra already has one bound to ⌘K, and a
 * user who has to remember which shortcut searches which half of their own app
 * has been given a worse tool, not a bigger one. Spec §32 and §33 are satisfied
 * by extending what exists.
 *
 * This lives in its own component so the store subscription only exists while the
 * dialog is open. Mounted in the palette body it would subscribe globally, and
 * every habit tick anywhere in the app would re-render a closed dialog.
 */

export const SECOND_BRAIN_SECTIONS = [
    { label: 'Second Brain', href: '/second-brain' },
    { label: 'Today', href: '/second-brain/today' },
    { label: 'Habits', href: '/second-brain/habits' },
    { label: 'Routines', href: '/second-brain/routines' },
    { label: 'Fitness', href: '/second-brain/fitness' },
    { label: 'Learning', href: '/second-brain/learning' },
    { label: 'Library', href: '/second-brain/library' },
    { label: 'Goals', href: '/second-brain/goals' },
    { label: 'Areas', href: '/second-brain/areas' },
    { label: 'Reflect', href: '/second-brain/reflect' },
    { label: 'Analytics', href: '/second-brain/analytics' },
    { label: 'Finance', href: '/second-brain/finance' },
    { label: 'Archive', href: '/second-brain/archive' },
    { label: 'Second Brain settings', href: '/second-brain/settings' },
]

export function SecondBrainCommands({
    query,
    run,
}: {
    query: string
    /** Closes the dialog, then performs the action. */
    run: (command: () => unknown) => void
}) {
    const router = useRouter()
    const data = useSecondBrainData()
    const ready = useStoreReady()
    const { create } = useSecondBrainActions()

    const needle = query.trim().toLowerCase()

    const sections = useMemo(
        () =>
            needle.length === 0
                ? []
                : SECOND_BRAIN_SECTIONS.filter(s => s.label.toLowerCase().includes(needle)).slice(0, 5),
        [needle]
    )

    const hits = useMemo(() => (ready ? searchSecondBrain(data, query) : []), [ready, data, query])

    /*
     * Quick capture (spec §8), folded into the palette rather than given its own
     * modal. The whole point of capture is that it costs nothing — ⌘K, type the
     * thought, Enter is about as close to nothing as an interface gets.
     *
     * It is offered only once the query is long enough to be a real thought, and
     * never when something already matches, so it can't shadow a search result.
     */
    const canCapture = query.trim().length >= 3 && hits.length === 0

    const captureIdea = () => {
        const stamp = new Date().toISOString()
        create('ideas', {
            id: createId('idea'),
            createdAt: stamp,
            updatedAt: stamp,
            archivedAt: null,
            title: query.trim(),
            description: '',
            areaId: null,
            status: 'raw',
            potential: 3,
            effort: 3,
        })
        router.push('/second-brain/library')
    }

    if (sections.length === 0 && hits.length === 0 && !canCapture) return null

    return (
        <>
            <CommandSeparator />

            {hits.length > 0 && (
                <CommandGroup heading="Second Brain">
                    {hits.map(hit => (
                        <CommandItem
                            key={hit.id}
                            value={`sb-${hit.id}`}
                            onSelect={() => run(() => router.push(hit.href))}
                        >
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                            <span className="truncate flex-1">{hit.title}</span>
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                {hit.detail ? `${hit.kind} · ${hit.detail}` : hit.kind}
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}

            {sections.length > 0 && (
                <CommandGroup heading="Second Brain sections">
                    {sections.map(section => (
                        <CommandItem
                            key={section.href}
                            value={`sb-nav-${section.href}`}
                            onSelect={() => run(() => router.push(section.href))}
                        >
                            <Brain className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                            <span>{section.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}

            {canCapture && (
                <CommandGroup heading="Capture">
                    <CommandItem value="sb-capture" onSelect={() => run(captureIdea)}>
                        <Lightbulb className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                        <span className="truncate">
                            Save &ldquo;{query.trim()}&rdquo; as an idea
                        </span>
                    </CommandItem>
                </CommandGroup>
            )}
        </>
    )
}
