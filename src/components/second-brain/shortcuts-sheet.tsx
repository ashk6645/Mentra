'use client'

import { Kbd } from './kbd'
import { Modal } from './overlay'
import type { Shortcut } from '@/lib/second-brain/use-shortcuts'
import { cn } from '@/lib/utils'
import { INK, T } from '@/lib/second-brain/ui'

/**
 * The `?` sheet.
 *
 * A keyboard layer with no way to learn it is a private API. The list is the
 * screen's own shortcut array, so it can never drift from what is bound.
 */
export function ShortcutsSheet({
    open,
    onOpenChange,
    shortcuts,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    shortcuts: Shortcut[]
}) {
    return (
        <Modal open={open} onOpenChange={onOpenChange} title="Keyboard shortcuts" width={380}>
            <div className="-my-1 flex flex-col">
                {shortcuts.map(shortcut => (
                    <div key={shortcut.key} className="flex h-9 items-center justify-between">
                        <span className={cn(T.body, INK.default)}>{shortcut.description}</span>
                        <Kbd>{shortcut.display}</Kbd>
                    </div>
                ))}
            </div>
        </Modal>
    )
}
