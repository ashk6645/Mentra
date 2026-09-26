'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { TaskTablePrefs } from './types'

/**
 * Per-view table preferences — sort, hidden columns, grouping — remembered in
 * this browser.
 *
 * These describe how someone likes to look at their tasks, not the tasks
 * themselves, so they don't belong in the database. `useSyncExternalStore`
 * keeps every table using the same key in step (and other tabs, via the
 * `storage` event), and serves the defaults during server rendering so
 * hydration never mismatches.
 */

const PREFIX = 'mentra.task-table.'
const listeners = new Set<() => void>()

/** Where preferences live for the session when localStorage refuses them. */
const memory = new Map<string, string>()

/** Parsed values, cached by their raw string so snapshots stay referentially stable. */
const cache = new Map<string, { raw: string | null; value: Partial<TaskTablePrefs> }>()

function read(key: string): Partial<TaskTablePrefs> {
    let raw: string | null = memory.get(key) ?? null
    try {
        raw = window.localStorage.getItem(PREFIX + key) ?? raw
    } catch {
        // Storage blocked (private mode): the in-memory copy stands in.
    }

    const cached = cache.get(key)
    if (cached && cached.raw === raw) return cached.value

    let value: Partial<TaskTablePrefs> = {}
    try {
        value = raw ? (JSON.parse(raw) as Partial<TaskTablePrefs>) : {}
    } catch {
        value = {}
    }
    cache.set(key, { raw, value })
    return value
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key.startsWith(PREFIX)) listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
    }
}

const EMPTY: Partial<TaskTablePrefs> = {}

export function useTablePrefs(key: string, defaults: TaskTablePrefs) {
    const stored = useSyncExternalStore(subscribe, () => read(key), () => EMPTY)
    const prefs: TaskTablePrefs = { ...defaults, ...stored }

    const update = useCallback(
        (patch: Partial<TaskTablePrefs>) => {
            const raw = JSON.stringify({ ...read(key), ...patch })
            memory.set(key, raw)
            try {
                window.localStorage.setItem(PREFIX + key, raw)
            } catch {
                // Not persisted across reloads, but the session keeps it.
            }
            for (const listener of listeners) listener()
        },
        [key]
    )

    return [prefs, update] as const
}
