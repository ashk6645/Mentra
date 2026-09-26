'use client'

import { useCallback, useMemo, useState } from 'react'
import type { TaskTableTask } from './types'

interface Patch<T> {
    fields: Partial<T>
    /** Saves still in flight for this task. */
    pending: number
}

interface Draft<T> {
    tempId: string
    task: T
    /** The real id, once the server has created it. */
    createdId?: string
}

/**
 * Instant edits over server data.
 *
 * An edit shows at once as a patch over the server's copy of the task. The patch
 * is held until fresh server data arrives *after* its save finished — only then
 * is the server's copy trusted to include it. Dropping it any earlier (when the
 * save resolves, say) makes the old value flash back for the moment before the
 * refreshed data lands. Tasks being created appear the same way, as drafts, and
 * deleted ones disappear at once and stay gone.
 *
 * `useOptimistic` was the obvious tool and the wrong one here: its value ends
 * with the transition, and `router.refresh()` can't be awaited, so the flash
 * back is exactly what it produces.
 */
export function useOptimisticTasks<T extends TaskTableTask>(tasks: T[]) {
    const [patches, setPatches] = useState<Record<string, Patch<T>>>({})
    const [drafts, setDrafts] = useState<Draft<T>[]>([])
    /** Deleted here, still in the server data until the refresh lands. */
    const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set())

    // New server data: forget patches whose saves have all finished, and drafts
    // the server now returns for real. Adjusted during render rather than in an
    // effect, so there is never a frame showing both the draft and the real row.
    const [seen, setSeen] = useState(tasks)
    if (seen !== tasks) {
        setSeen(tasks)
        setPatches(previous => {
            const kept = Object.entries(previous).filter(([, patch]) => patch.pending > 0)
            return kept.length === Object.keys(previous).length ? previous : Object.fromEntries(kept)
        })
        const ids = new Set(tasks.map(task => task.id))
        setRemoved(previous => {
            const kept = [...previous].filter(id => ids.has(id))
            return kept.length === previous.size ? previous : new Set(kept)
        })
        setDrafts(previous => {
            const kept = previous.filter(draft => !(draft.createdId && ids.has(draft.createdId)))
            return kept.length === previous.length ? previous : kept
        })
    }

    const rows = useMemo(() => {
        const merged = tasks
            .filter(task => !removed.has(task.id))
            .map(task => {
                const patch = patches[task.id]
                return patch ? { ...task, ...patch.fields } : task
            })
        return drafts.length ? [...merged, ...drafts.map(draft => draft.task)] : merged
    }, [tasks, patches, drafts, removed])

    /** Show an edit now; call `settle` or `fail` when its save returns. */
    const begin = useCallback((id: string, fields: Partial<T>) => {
        setPatches(previous => ({
            ...previous,
            [id]: { fields: { ...previous[id]?.fields, ...fields }, pending: (previous[id]?.pending ?? 0) + 1 },
        }))
    }, [])

    const settle = useCallback((id: string) => {
        setPatches(previous => {
            const patch = previous[id]
            if (!patch) return previous
            return { ...previous, [id]: { ...patch, pending: Math.max(0, patch.pending - 1) } }
        })
    }, [])

    /** A save failed: put the server's values back. */
    const fail = useCallback((id: string) => {
        setPatches(previous => {
            if (!previous[id]) return previous
            const next = { ...previous }
            delete next[id]
            return next
        })
    }, [])

    const addDraft = useCallback((tempId: string, task: T) => {
        setDrafts(previous => [...previous, { tempId, task }])
    }, [])

    const resolveDraft = useCallback((tempId: string, createdId: string) => {
        setDrafts(previous => previous.map(draft => (draft.tempId === tempId ? { ...draft, createdId } : draft)))
    }, [])

    const dropDraft = useCallback((tempId: string) => {
        setDrafts(previous => previous.filter(draft => draft.tempId !== tempId))
    }, [])

    /** Hide a task being deleted; `restore` brings it back if the delete fails. */
    const hide = useCallback((id: string) => {
        setRemoved(previous => new Set(previous).add(id))
    }, [])

    const restore = useCallback((id: string) => {
        setRemoved(previous => {
            if (!previous.has(id)) return previous
            const next = new Set(previous)
            next.delete(id)
            return next
        })
    }, [])

    return { rows, begin, settle, fail, addDraft, resolveDraft, dropDraft, hide, restore }
}
