'use client'

import { useEffect } from 'react'

export interface Shortcut {
    /** `event.key`, compared case-insensitively. */
    key: string
    /** Human-readable key for the help sheet, e.g. "→" or "N". */
    display: string
    description: string
    run: () => void
}

/**
 * Should this keystroke be left alone?
 *
 * Typing "Morning walk" into a name field must not switch views on the M, a key
 * pressed inside an open dialog or menu belongs to that layer, and the arrows
 * belong to a grid that is using them to move between cells.
 */
function isOwnedElsewhere(event: KeyboardEvent): boolean {
    const target = event.target
    if (!(target instanceof HTMLElement)) return false

    // A grid that moves focus with the arrows keeps them while focused.
    if (event.key.startsWith('Arrow') && target.closest('[data-arrow-nav]')) return true

    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable) return true

    return target.closest('[role="dialog"],[role="menu"],[role="listbox"],[data-no-shortcuts]') !== null
}

/**
 * Single-key shortcuts for a Second Brain screen.
 *
 * Listens in the capture phase and stops the event once it matches. Mentra binds
 * single keys app-wide too — N opens the task quick-add — and both listeners sit
 * on `window`, so without this one press would open a new habit *and* a new task.
 * Capturing first makes the screen-level meaning win, the way a contextual
 * shortcut should, while every key this screen doesn't claim still reaches the
 * app's own handler untouched.
 */
export function useShortcuts(shortcuts: Shortcut[], enabled = true) {
    useEffect(() => {
        if (!enabled) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return
            if (isOwnedElsewhere(event)) return

            const match = shortcuts.find(s => s.key.toLowerCase() === event.key.toLowerCase())
            if (!match) return

            event.preventDefault()
            event.stopPropagation()
            match.run()
        }

        window.addEventListener('keydown', onKeyDown, { capture: true })
        return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
    }, [shortcuts, enabled])
}
