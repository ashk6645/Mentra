'use client'

import { useCallback, useRef, useState } from 'react'
import { Modal } from './overlay'
import { Button } from './primitives'

interface ConfirmOptions {
    title: string
    description: string
    /** Verb for the confirming button — "Delete", "Clear". Never "OK". */
    confirmLabel: string
    /** Styles the action red. Use for anything that destroys data. */
    destructive?: boolean
}

/**
 * A styled, promise-returning replacement for `window.confirm`.
 *
 * Reserved for the one action that can't be undone. Everything else deletes
 * immediately and offers Undo, which is kinder than asking first.
 *
 *     if (!(await confirm({ ... }))) return
 *
 * Destructure both, call `confirm`, and render `dialog` somewhere in the tree.
 */
export function useConfirm() {
    const [request, setRequest] = useState<ConfirmOptions | null>(null)
    // Separate from `request` so the text stays put while the dialog animates out.
    const [open, setOpen] = useState(false)

    // The pending promise's resolver. A ref because changing it must not render,
    // and it is only touched from event handlers.
    const resolver = useRef<((confirmed: boolean) => void) | null>(null)

    const confirm = useCallback((options: ConfirmOptions) => {
        setRequest(options)
        setOpen(true)
        return new Promise<boolean>(resolve => {
            resolver.current = resolve
        })
    }, [])

    const settle = useCallback((confirmed: boolean) => {
        // Resolve on every path out, Escape and backdrop included — a dismissal
        // that never resolves leaves the caller awaiting forever.
        resolver.current?.(confirmed)
        resolver.current = null
        setOpen(false)
    }, [])

    const dialog = (
        <Modal
            open={open}
            onOpenChange={next => {
                if (!next) settle(false)
            }}
            title={request?.title ?? ''}
            description={request?.description}
            width={400}
            footer={
                <div className="flex w-full justify-end gap-2">
                    <Button variant="ghost" onClick={() => settle(false)}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={() => settle(true)}
                        className={request?.destructive ? 'bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-600 dark:text-white' : undefined}
                    >
                        {request?.confirmLabel}
                    </Button>
                </div>
            }
        />
    )

    return { confirm, dialog }
}
