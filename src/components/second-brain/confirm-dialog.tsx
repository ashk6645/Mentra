'use client'

import { useCallback, useRef, useState } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
    title: string
    description: string
    /** Verb for the confirming button — "Delete", "Discard". Not "OK". */
    confirmLabel: string
    /** Styles the action red. Use for anything that destroys data. */
    destructive?: boolean
}

/**
 * A styled replacement for `window.confirm`.
 *
 * The native dialog was wrong on three counts: it blocks the main thread, it
 * cannot be styled so it looks like it belongs to the browser rather than the
 * app, and its buttons say "OK" and "Cancel" — the least informative pair of
 * words available at the moment the user most needs to know what they are about
 * to do. Spec §40 asks for real modals; §68 asks that destructive actions be
 * hard to trigger by accident.
 *
 * Returns a promise so call sites keep reading top to bottom:
 *
 *     if (!(await confirm({ ... }))) return
 *
 * Usage: destructure both, call `confirm`, and render `dialog` somewhere in the
 * component's tree.
 */
export function useConfirm() {
    const [request, setRequest] = useState<ConfirmOptions | null>(null)

    // Holds the pending promise's resolver between opening the dialog and the
    // user answering. A ref rather than state because changing it must not
    // trigger a render, and it is only ever touched from event handlers.
    const resolver = useRef<((confirmed: boolean) => void) | null>(null)

    const confirm = useCallback((options: ConfirmOptions) => {
        setRequest(options)
        return new Promise<boolean>(resolve => {
            resolver.current = resolve
        })
    }, [])

    const settle = useCallback((confirmed: boolean) => {
        // Resolve before clearing, and null the ref either way — a dismissal
        // that never resolves would leave the caller awaiting forever.
        resolver.current?.(confirmed)
        resolver.current = null
        setRequest(null)
    }, [])

    const dialog = (
        <AlertDialog
            open={request !== null}
            // Covers Escape and overlay clicks as well as the Cancel button.
            onOpenChange={open => {
                if (!open) settle(false)
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{request?.title}</AlertDialogTitle>
                    <AlertDialogDescription>{request?.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => settle(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => settle(true)}
                        className={cn(
                            request?.destructive &&
                                'bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-600 dark:text-white'
                        )}
                    >
                        {request?.confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

    return { confirm, dialog }
}
