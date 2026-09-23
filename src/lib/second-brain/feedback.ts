import { toast } from 'sonner'

/**
 * Feedback for Second Brain actions, through the app's existing sonner toaster.
 *
 * Deliberately plain toasts rather than `toast.success`: a green tick on every
 * confirmation makes the routine look like an achievement, and the one accent
 * colour in this feature is reserved for things actually being done.
 */

export function notify(message: string): void {
    toast(message)
}

/**
 * Confirmation with a way back, for anything destructive.
 *
 * Eight seconds rather than the default: reading "Deleted", realising it was a
 * mistake and reaching the button takes longer than the default window allows.
 * Undo is silent — the thing reappearing is confirmation enough.
 */
export function notifyWithUndo(message: string, undo: () => void): void {
    toast(message, {
        duration: 8000,
        action: { label: 'Undo', onClick: undo },
    })
}
