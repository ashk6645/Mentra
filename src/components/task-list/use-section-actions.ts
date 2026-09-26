'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSection, deleteSection, reorderSections, updateSection } from '@/lib/actions/sections'
import type { TaskTableSection } from '@/components/task-table/types'

/** A section still being created has no server id to act on yet. */
export const isDraftSection = (id: string) => id.startsWith('draft-section-')

/**
 * Sections, changed instantly.
 *
 * The list keeps its own copy of the project's sections so adding, renaming,
 * moving and deleting show at once. The copy follows the server's whenever fresh
 * data arrives, and a failed save goes back to it with a message.
 */
export function useSectionActions(projectId: string, sections: TaskTableSection[]) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const [local, setLocal] = useState(sections)

    // Fresh server data replaces the local copy — adjusted during render, as
    // React recommends, rather than synced in an effect.
    const [seen, setSeen] = useState(sections)
    if (seen !== sections) {
        setSeen(sections)
        setLocal(sections)
    }

    /** Run a save; on failure, return to the server's copy and say what failed. */
    const save = useCallback(
        (what: string, action: () => Promise<{ success: boolean; error?: string }>) => {
            startTransition(async () => {
                const result = await action()
                if (!result.success) {
                    setLocal(sections)
                    toast.error(`Couldn’t ${what}`, { description: result.error })
                    return
                }
                router.refresh()
            })
        },
        [sections, router]
    )

    /** Add a section at `index` — the server appends, so a mid-list add is followed by a reorder. */
    const create = useCallback(
        (name: string, index: number) => {
            const clean = name.trim()
            if (!clean) return

            const tempId = `draft-section-${crypto.randomUUID()}`
            const next = [...local]
            next.splice(index, 0, { id: tempId, name: clean })
            setLocal(next)

            save('add the section', async () => {
                const result = await createSection(projectId, clean)
                if (!result.success || !result.data) return { success: false, error: result.error }
                if (index >= local.length) return { success: true }
                const order = next.map(s => (s.id === tempId ? result.data!.id : s.id))
                return reorderSections(projectId, order)
            })
        },
        [local, projectId, save]
    )

    const rename = useCallback(
        (id: string, name: string) => {
            if (isDraftSection(id)) return
            const clean = name.trim()
            const current = local.find(s => s.id === id)
            if (!clean || !current || current.name === clean) return
            setLocal(local.map(s => (s.id === id ? { ...s, name: clean } : s)))
            save('rename the section', () => updateSection(id, clean))
        },
        [local, save]
    )

    const move = useCallback(
        (id: string, direction: -1 | 1) => {
            if (isDraftSection(id)) return
            const from = local.findIndex(s => s.id === id)
            const to = from + direction
            if (from < 0 || to < 0 || to >= local.length) return
            const next = [...local]
            ;[next[from], next[to]] = [next[to], next[from]]
            setLocal(next)
            save('move the section', () => reorderSections(projectId, next.filter(s => !isDraftSection(s.id)).map(s => s.id)))
        },
        [local, projectId, save]
    )

    /** Delete a section. Its tasks aren't deleted — the server moves them out of it. */
    const remove = useCallback(
        (id: string) => {
            if (isDraftSection(id)) return
            setLocal(local.filter(s => s.id !== id))
            save('delete the section', () => deleteSection(id))
        },
        [local, save]
    )

    return { sections: local, create, rename, move, remove }
}
