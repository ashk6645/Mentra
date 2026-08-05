'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Kbd } from './kbd'
import { LABEL, T, INK, HAIRLINE } from '@/lib/second-brain/ui'
import type { Shortcut } from '@/lib/second-brain/use-shortcuts'
import { cn } from '@/lib/utils'

interface ShortcutsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shortcuts: Shortcut[]
}

/**
 * The `?` sheet.
 *
 * Shortcuts that aren't discoverable may as well not exist, and a keyboard layer
 * with no way to learn it is a private API. Groups are derived from the shortcut
 * list itself so this can never drift out of sync with what's actually bound.
 */
export function ShortcutsSheet({ open, onOpenChange, shortcuts }: ShortcutsSheetProps) {
    const groups = useMemo(() => {
        const byGroup = new Map<string, Shortcut[]>()

        for (const shortcut of shortcuts) {
            const existing = byGroup.get(shortcut.group)
            if (existing) existing.push(shortcut)
            else byGroup.set(shortcut.group, [shortcut])
        }

        return [...byGroup.entries()]
    }, [shortcuts])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className={cn(T.title, 'text-[16px]')}>
                        Keyboard shortcuts
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-1">
                    {groups.map(([group, items], index) => (
                        <div key={group} className="flex flex-col gap-1">
                            <span className={cn(LABEL, 'mb-1.5')}>{group}</span>

                            {items.map(shortcut => (
                                <div
                                    key={shortcut.key}
                                    className="flex items-center justify-between py-[5px]"
                                >
                                    <span className={cn(T.body, INK.default)}>
                                        {shortcut.description}
                                    </span>
                                    <Kbd>{shortcut.display}</Kbd>
                                </div>
                            ))}

                            {index < groups.length - 1 && (
                                <div className={cn('mt-4 border-b', HAIRLINE)} />
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
