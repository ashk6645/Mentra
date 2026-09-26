import { act, render, screen } from '@testing-library/react'
import type { DragEndEvent } from '@dnd-kit/core'
import { TaskSubtasks } from '../task-subtasks'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { reorderSubtasks } from '@/lib/actions/subtasks'

/**
 * Reordering subtasks in the task panel.
 *
 * Regression: after a drag, the list snapped back to its old order and only
 * showed the new one after a page reload. The panel re-sorts by `sortOrder`
 * whenever its copy of the task changes, and the moved list still carried the
 * old numbers. These tests drive the real prop-sync path through the store.
 */

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

jest.mock('@/lib/actions/subtasks', () => ({
    createSubtask: jest.fn(),
    updateSubtask: jest.fn(),
    deleteSubtask: jest.fn(),
    reorderSubtasks: jest.fn(),
}))

jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }))

// Dragging with a real pointer isn't possible in jsdom, so capture the drop
// handler dnd-kit is given and call it directly with a drop.
let drop: ((event: DragEndEvent) => Promise<void> | void) | undefined
jest.mock('@dnd-kit/core', () => {
    const actual = jest.requireActual('@dnd-kit/core')
    return {
        ...actual,
        DndContext: ({ onDragEnd, children }: { onDragEnd: typeof drop; children: React.ReactNode }) => {
            drop = onDragEnd
            return children
        },
    }
})

const subtasks = [
    { id: 'a', title: 'First', completed: false, sortOrder: 0 },
    { id: 'b', title: 'Second', completed: false, sortOrder: 1 },
    { id: 'c', title: 'Third', completed: false, sortOrder: 2 },
]

/** Renders the section from the store, the way the panel does. */
function Harness() {
    const task = useTaskDetailStore(state => state.selectedTask)
    return task ? <TaskSubtasks task={task} /> : null
}

const titles = () => screen.getAllByLabelText('Subtask').map(input => (input as HTMLInputElement).value)

const dragLastToTop = () =>
    act(async () => {
        await drop!({ active: { id: 'c' }, over: { id: 'a' } } as unknown as DragEndEvent)
    })

beforeEach(() => {
    jest.clearAllMocks()
    useTaskDetailStore.getState().selectTask('t1', { id: 't1', completed: false, subtasks })
})

describe('reordering subtasks', () => {
    it('keeps the new order after the drop instead of snapping back', async () => {
        ;(reorderSubtasks as jest.Mock).mockResolvedValue({ success: true, data: true })
        render(<Harness />)
        expect(titles()).toEqual(['First', 'Second', 'Third'])

        await dragLastToTop()

        expect(titles()).toEqual(['Third', 'First', 'Second'])
        expect(reorderSubtasks).toHaveBeenCalledWith('t1', ['c', 'a', 'b'])
    })

    it('stores the renumbered order, so reopening the task shows it too', async () => {
        ;(reorderSubtasks as jest.Mock).mockResolvedValue({ success: true, data: true })
        render(<Harness />)

        await dragLastToTop()

        const stored = useTaskDetailStore.getState().selectedTask.subtasks
        expect(stored.map((s: { id: string; sortOrder: number }) => [s.id, s.sortOrder])).toEqual([
            ['c', 0], ['a', 1], ['b', 2],
        ])
        expect(refresh).toHaveBeenCalled()
    })

    it('puts the old order back if the save fails', async () => {
        ;(reorderSubtasks as jest.Mock).mockResolvedValue({ success: false, error: 'nope' })
        render(<Harness />)

        await dragLastToTop()

        expect(titles()).toEqual(['First', 'Second', 'Third'])
        expect(refresh).not.toHaveBeenCalled()
    })
})
