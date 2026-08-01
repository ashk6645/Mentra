'use client'

import { useEffect } from 'react'

export interface Shortcut {
    /** `event.key`, compared case-insensitively. */
    key: string
    /** Human-readable key for the help sheet, e.g. "→" or "D". */
    display: string
    description: string
    group: string
    run: () => void
}

/**
 * Should this keystroke be ignored because the user is typing?
 *
 * Without this, typing "Deep work" into the habit name field would switch to Day
 * view on the D. Covers native fields plus contenteditable, and any element that
 * has opted out via `data-no-shortcuts`.
 */
function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false

    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable) return true
    if (target.closest('[data-no-shortcuts]')) return true

    return false
}

/**
 * Global single-key shortcuts.
 *
 * Deliberately unmodified keys. Linear's model is that a keyboard user shouldn't
 * need a chord to move between views, and the typing guard above is what makes
 * that safe. Any combination with a modifier is skipped so browser and OS
 * shortcuts (⌘K, ⌘R, ⌘←) keep working.
 */
export function useShortcuts(shortcuts: Shortcut[], enabled = true) {
    useEffect(() => {
        if (!enabled) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return
            if (isTypingTarget(event.target)) return

            const match = shortcuts.find(s => s.key.toLowerCase() === event.key.toLowerCase())
            if (!match) return

            event.preventDefault()
            match.run()
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [shortcuts, enabled])
}
