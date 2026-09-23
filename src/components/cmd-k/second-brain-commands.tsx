'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Search } from 'lucide-react'
import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'
import { useSecondBrainData, useStoreReady } from '@/lib/second-brain/repo'
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
    { label: 'Habits', href: '/second-brain/habits' },
    { label: 'Routines', href: '/second-brain/routines' },
    { label: 'Goals', href: '/second-brain/goals' },
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

    const needle = query.trim().toLowerCase()

    const sections = useMemo(
        () =>
            needle.length === 0
                ? []
                : SECOND_BRAIN_SECTIONS.filter(s => s.label.toLowerCase().includes(needle)).slice(0, 5),
        [needle]
    )

    const hits = useMemo(() => (ready ? searchSecondBrain(data, query) : []), [ready, data, query])

    if (sections.length === 0 && hits.length === 0) return null

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
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">{hit.kind}</span>
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
        </>
    )
}
