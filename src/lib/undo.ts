'use client'

import { toast } from 'sonner'

/**
 * Undo for destructive actions — act at once, take it back for a few seconds.
 *
 * Asking "Are you sure?" before every delete is slow and still can't save you
 * from the one you meant to keep. Instead the change shows immediately and the
 * real, permanent step waits: a toast offers Undo (as does ⌘Z) until it runs.
 *
 * The wait is module-level, not tied to a component, so the delete still goes
 * through if you navigate away. If the tab closes first, the permanent step may
 * never reach the server — the item simply comes back, which is the safe way to
 * fail.
 */

const WINDOW_MS = 5000

interface Pending {
    commit: () => void
    undo: () => void
    timer: ReturnType<typeof setTimeout>
}

/** In the order they happened, so ⌘Z takes back the latest first. */
const pending = new Map<string, Pending>()

/** Run the permanent step now. */
function settle(id: string) {
    const entry = pending.get(id)
    if (!entry) return
    pending.delete(id)
    clearTimeout(entry.timer)
    entry.commit()
}

/** Take it back: the permanent step never runs. */
function cancel(id: string) {
    const entry = pending.get(id)
    if (!entry) return
    pending.delete(id)
    clearTimeout(entry.timer)
    toast.dismiss(id)
    entry.undo()
}

/** Undo the most recent pending action. Returns whether there was one. */
export function undoLast(): boolean {
    const last = Array.from(pending.keys()).pop()
    if (!last) return false
    cancel(last)
    return true
}

const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

let listening = false
function listen() {
    if (listening || typeof window === 'undefined') return
    listening = true
    window.addEventListener('keydown', event => {
        if (event.key.toLowerCase() !== 'z' || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return
        // In a field, ⌘Z belongs to the field.
        if (isTyping(event.target) || pending.size === 0) return
        event.preventDefault()
        undoLast()
    })
    // Best effort: leaving the page commits whatever is waiting.
    window.addEventListener('pagehide', () => Array.from(pending.keys()).forEach(settle))
}

/**
 * Show a change now; make it permanent in a few seconds unless undone.
 *
 * `undo` reverses what the caller already showed; `commit` does the permanent
 * part (and handles its own failure).
 */
export function withUndo({ message, undo, commit }: { message: string; undo: () => void; commit: () => void }) {
    listen()
    const id = `undo-${crypto.randomUUID()}`
    pending.set(id, { commit, undo, timer: setTimeout(() => settle(id), WINDOW_MS) })

    toast(message, {
        id,
        duration: WINDOW_MS,
        action: { label: 'Undo', onClick: () => cancel(id) },
        // Closed early (✕ or swipe): no reason to wait any longer.
        onDismiss: () => settle(id),
    })
}
