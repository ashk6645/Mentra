import { create } from 'zustand'
import { toast } from 'sonner'
import { deleteTask } from '@/lib/actions/tasks'
import { withUndo } from '@/lib/undo'
import { useTaskDetailStore } from './use-task-detail-store'

/**
 * Tasks and sections deleted in this session, hidden everywhere at once.
 *
 * A delete shows immediately but reaches the server only after its Undo window,
 * so views can't wait for fresh data to drop it. Every view filters by this set
 * instead — delete a task from the detail panel and the list behind it agrees.
 * Ids stay here once deleted (they're never reused), so a refresh that lands a
 * moment late can't flash the item back.
 */
interface DeletedStore {
    ids: ReadonlySet<string>
    hide: (id: string) => void
    show: (id: string) => void
}

export const useDeletedStore = create<DeletedStore>(set => ({
    ids: new Set(),
    hide: id => set(state => ({ ids: new Set(state.ids).add(id) })),
    show: id =>
        set(state => {
            const ids = new Set(state.ids)
            ids.delete(id)
            return { ids }
        }),
}))

/**
 * Delete a task with Undo: gone from view now, from the server in a few
 * seconds unless taken back. `refresh` fetches fresh data once it's done.
 */
export function deleteTaskWithUndo(task: { id: string; title: string }, refresh: () => void) {
    const { hide, show } = useDeletedStore.getState()
    hide(task.id)

    const { selectedTaskId, closePanel } = useTaskDetailStore.getState()
    if (selectedTaskId === task.id) closePanel()

    withUndo({
        message: 'Task deleted',
        undo: () => show(task.id),
        commit: async () => {
            const result = await deleteTask(task.id)
            if (!result.success) {
                show(task.id)
                toast.error('Couldn’t delete the task', { description: result.error })
                return
            }
            refresh()
        },
    })
}
