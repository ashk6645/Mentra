'use client'

import { useSyncExternalStore } from 'react'

/**
 * A tiny store for UI preferences that are not user data.
 *
 * Kept separate from the main store deliberately. That one is twenty-one arrays
 * of records, and "has this person seen the intro" is neither a record nor a
 * collection — bolting a scalar onto it would break the shape that `emptyData`,
 * the import validator and the export file all rely on.
 *
 * It lives in the repo layer rather than in a component because that is the only
 * layer allowed to know storage exists (spec §55).
 *
 * Preferences are intentionally *not* included in export/import: they describe
 * this browser, not the user's data, and restoring a backup should not replay
 * someone else's dismissed banners.
 */
const STORAGE_KEY = 'mentra.second-brain.prefs.v1'

interface Preferences {
    /** ISO timestamp, or null if the intro has never been dismissed. */
    introDismissedAt: string | null
}

const DEFAULTS: Preferences = { introDismissedAt: null }

let cache: Preferences | null = null
const listeners = new Set<() => void>()

function read(): Preferences {
    if (cache) return cache
    if (typeof window === 'undefined') return DEFAULTS

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        cache = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) } : DEFAULTS
    } catch {
        // Storage disabled or corrupt. Defaults mean the intro shows again,
        // which is a far better failure than a crash on a private-mode tab.
        cache = DEFAULTS
    }

    return cache
}

function write(patch: Partial<Preferences>): void {
    cache = { ...read(), ...patch }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    } catch {
        // In-memory only for this session. Not worth interrupting anyone over.
    }

    for (const listener of listeners) listener()
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)

    // Match the main store: another tab dismissing the intro should hide it
    // here too, rather than leaving each tab with its own stale cache.
    const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== STORAGE_KEY) return
        cache = null
        for (const l of listeners) l()
    }

    window.addEventListener('storage', onStorage)

    return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
    }
}

/**
 * Whether the first-run intro should be shown.
 *
 * The server snapshot is `false` — hidden — so SSR and the hydration pass agree
 * and the banner can only ever appear on the frame after hydration. Returning
 * the real value here would render the banner on the server for a visitor whose
 * browser had already dismissed it, which is a hydration mismatch.
 */
export function useShowIntro(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => read().introDismissedAt === null,
        () => false
    )
}

export function dismissIntro(): void {
    write({ introDismissedAt: new Date().toISOString() })
}

/** Exposed so "show me that again" is possible from Settings. */
export function restoreIntro(): void {
    write({ introDismissedAt: null })
}
