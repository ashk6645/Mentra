import { toast } from 'sonner'

/**
 * Feedback for Second Brain actions.
 *
 * Centralised rather than calling `toast` directly from fifteen views, for two
 * reasons. Consistency is the obvious one — durations and phrasing drift the
 * moment every component decides for itself. The other is that undo is easy to
 * get subtly wrong, and there should be exactly one implementation of it.
 *
 * Mentra already mounts sonner in the root layout, so this is wiring, not new
 * infrastructure.
 */

/** Confirmation for something that worked. Deliberately terse. */
export function notify(message: string): void {
    toast.success(message)
}

/** Something the user should know went wrong. */
export function notifyError(message: string): void {
    toast.error(message)
}

/**
 * Confirmation with a way back.
 *
 * Used for anything destructive. The window is longer than a normal toast
 * because reading "Deleted", realising it was a mistake and moving the mouse
 * takes longer than three seconds — the default duration would routinely expire
 * before a slower reader reached the button.
 *
 * The caller supplies a thunk that restores prior state. Every call site passes
 * a snapshot of the whole collection rather than trying to re-insert the removed
 * record, so order is restored exactly and there is no "undo put it back in the
 * wrong place" class of bug.
 */
export function notifyWithUndo(message: string, undo: () => void): void {
    toast.success(message, {
        duration: 8000,
        action: {
            label: 'Undo',
            onClick: () => {
                undo()
                toast.success('Restored.')
            },
        },
    })
}
