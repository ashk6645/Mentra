import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { TaskTable } from '../task-table'
import { createTask, toggleTaskCompletion, updateTask } from '@/lib/actions/tasks'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import type { TaskTableTask } from '../types'

/**
 * The task table end to end: rendering, sorting, filtering, grouping, instant
 * edits with rollback, adding rows, and opening a task in the detail panel.
 * Server actions are mocked; everything else is the real component.
 */

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

jest.mock('@/lib/actions/tasks', () => ({
    createTask: jest.fn(),
    toggleTaskCompletion: jest.fn(),
    updateTask: jest.fn(),
}))

jest.mock('@/lib/actions/tags', () => ({
    getTags: jest.fn().mockResolvedValue([{ id: 'g1', name: 'writing' }]),
    createTag: jest.fn(),
}))

jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }))

const base = { projectId: 'p1', createdAt: '2026-09-01T00:00:00.000Z', tags: [], subtasks: [] }

const TASKS: TaskTableTask[] = [
    { ...base, id: 't1', title: 'Write launch post', completed: false, priority: 'low', dueDate: '2026-10-03T00:00:00.000Z', sectionId: 's1', sortOrder: 0 },
    { ...base, id: 't2', title: 'Record demo video', completed: false, priority: 'urgent', dueDate: null, sectionId: 's2', sortOrder: 1 },
    { ...base, id: 't3', title: 'Book the venue', completed: false, priority: null, dueDate: '2026-09-28T00:00:00.000Z', sectionId: null, sortOrder: 2 },
    { ...base, id: 't4', title: 'Draft the headline', completed: true, priority: 'high', dueDate: null, sectionId: 's1', sortOrder: 3 },
]

const SECTIONS = [{ id: 's1', name: 'Marketing' }, { id: 's2', name: 'Product' }]

/** Task titles in the order the table shows them. */
const titles = () =>
    screen.queryAllByRole('row').map(row => row.getAttribute('data-task-id')).filter(Boolean)
        .map(id => TASKS.find(t => t.id === id)?.title ?? id)

const renderTable = (props: Partial<Parameters<typeof TaskTable>[0]> = {}) =>
    render(<TaskTable tasks={TASKS} sections={SECTIONS} projectId="p1" storageKey={`test-${Math.random()}`} {...props} />)

beforeEach(() => {
    jest.clearAllMocks()
    useTaskDetailStore.getState().closePanel()
})

describe('rendering', () => {
    it('groups open tasks by section, in the project’s order, hiding completed ones', async () => {
        renderTable()
        expect(await screen.findByText('Marketing')).toBeInTheDocument()
        expect(titles()).toEqual(['Write launch post', 'Record demo video', 'Book the venue'])
        expect(screen.getByText('No section')).toBeInTheDocument()
    })

    it('shows completed tasks when asked, after the open ones', () => {
        renderTable()
        fireEvent.click(screen.getByRole('button', { name: /Completed/ }))
        expect(titles()).toEqual(['Write launch post', 'Draft the headline', 'Record demo video', 'Book the venue'])
    })

    it('hides the Section column while rows sit under their section heading', () => {
        renderTable()
        expect(screen.queryByRole('columnheader', { name: /Section/ })).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'By section' }))
        fireEvent.click(screen.getByRole('button', { name: 'No grouping' }))
        expect(screen.getByRole('columnheader', { name: /Section/ })).toBeInTheDocument()
    })

    it('drops the Section column and grouping where there are no sections', () => {
        renderTable({ sections: [] })
        expect(screen.queryByRole('columnheader', { name: /Section/ })).not.toBeInTheDocument()
        expect(screen.queryByText('No section')).not.toBeInTheDocument()
    })
})

describe('sorting', () => {
    it('sorts by priority, highest first, with none last', () => {
        renderTable({ sections: [] })
        fireEvent.click(screen.getByRole('button', { name: 'Priority' }))
        expect(titles()).toEqual(['Record demo video', 'Write launch post', 'Book the venue'])
    })

    it('sorts by due date, soonest first, undated last — then reverses, then stops', () => {
        renderTable({ sections: [] })
        const due = screen.getByRole('button', { name: 'Due' })
        fireEvent.click(due)
        expect(titles()).toEqual(['Book the venue', 'Write launch post', 'Record demo video'])
        fireEvent.click(due)
        expect(titles()).toEqual(['Write launch post', 'Book the venue', 'Record demo video'])
        fireEvent.click(due)
        expect(titles()).toEqual(['Write launch post', 'Record demo video', 'Book the venue'])
    })
})

describe('filtering', () => {
    it('narrows rows by title and says so when nothing matches', () => {
        renderTable({ sections: [] })
        fireEvent.change(screen.getByLabelText('Filter tasks'), { target: { value: 'VIDEO' } })
        expect(titles()).toEqual(['Record demo video'])
        fireEvent.change(screen.getByLabelText('Filter tasks'), { target: { value: 'nothing like this' } })
        expect(screen.getByText(/No tasks match/)).toBeInTheDocument()
    })
})

describe('editing', () => {
    it('completes a task at once and saves it through the completion path', async () => {
        ;(toggleTaskCompletion as jest.Mock).mockResolvedValue({ success: true })
        renderTable({ sections: [] })

        const box = screen.getByRole('checkbox', { name: 'Mark “Record demo video” done' })
        await act(async () => fireEvent.click(box))

        expect(toggleTaskCompletion).toHaveBeenCalledWith('t2', true)
        expect(refresh).toHaveBeenCalled()
        // Completed tasks are hidden by default, so it leaves the list.
        expect(titles()).not.toContain('Record demo video')
    })

    it('puts the old value back if a save fails', async () => {
        ;(updateTask as jest.Mock).mockResolvedValue({ success: false, error: 'nope' })
        renderTable({ sections: [] })

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Priority Urgent' })))
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Low' })))

        expect(updateTask).toHaveBeenCalledWith({ id: 't2', priority: 'low' })
        expect(screen.getByRole('button', { name: 'Priority Urgent' })).toBeInTheDocument()
        expect(refresh).not.toHaveBeenCalled()
    })

    it('keeps an edit shown until fresh server data arrives', async () => {
        ;(updateTask as jest.Mock).mockResolvedValue({ success: true })
        const { rerender } = renderTable({ sections: [] })

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Priority Urgent' })))
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'High' })))
        expect(screen.getByRole('button', { name: 'Priority High' })).toBeInTheDocument()

        // The refreshed server data now carries the change.
        const fresh = TASKS.map(t => (t.id === 't2' ? { ...t, priority: 'high' } : t))
        rerender(<TaskTable tasks={fresh} sections={[]} projectId="p1" storageKey="test-fresh" />)
        expect(screen.getByRole('button', { name: 'Priority High' })).toBeInTheDocument()
    })
})

describe('adding', () => {
    it('adds a task to the section it was typed in, shown straight away', async () => {
        let resolve: (value: unknown) => void = () => {}
        ;(createTask as jest.Mock).mockReturnValue(new Promise(r => { resolve = r }))
        renderTable()

        const header = screen.getAllByRole('button', { expanded: true }).find(b => b.textContent?.startsWith('Product'))!
        const product = header.closest('[role="rowgroup"]') as HTMLElement
        fireEvent.click(within(product).getByRole('button', { name: /New task/ }))
        const input = within(product).getByLabelText('New task')
        fireEvent.change(input, { target: { value: 'Ship the beta' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        expect(createTask).toHaveBeenCalledWith({ title: 'Ship the beta', projectId: 'p1', sectionId: 's2' })
        expect(within(product).getByText('Ship the beta')).toBeInTheDocument()

        await act(async () => resolve({ success: true, data: { id: 't9' } }))
        expect(refresh).toHaveBeenCalled()
    })
})

describe('opening', () => {
    it('opens a row in the detail panel with its project and section', () => {
        renderTable({ project: { id: 'p1', name: 'Launch', icon: '🚀', color: '#000' } })
        fireEvent.click(screen.getByText('Write launch post'))

        const { selectedTaskId, selectedTask } = useTaskDetailStore.getState()
        expect(selectedTaskId).toBe('t1')
        expect(selectedTask.project.name).toBe('Launch')
        expect(selectedTask.section.name).toBe('Marketing')
    })

    it('does not open the row when a control inside it is used', async () => {
        ;(toggleTaskCompletion as jest.Mock).mockResolvedValue({ success: true })
        renderTable()
        await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Mark “Write launch post” done' })))
        expect(useTaskDetailStore.getState().selectedTaskId).toBeNull()
    })
})
