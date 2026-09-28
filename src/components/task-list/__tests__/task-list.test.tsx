import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { TaskList } from '../task-list'
import { createTask, deleteTask } from '@/lib/actions/tasks'
import { createSection, deleteSection, reorderSections, updateSection } from '@/lib/actions/sections'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useTaskSelectionStore } from '@/stores/use-task-selection-store'
import { useDeletedStore } from '@/stores/use-deleted-store'
import { toast } from 'sonner'
import type { TaskTableTask } from '@/components/task-table/types'

/**
 * The project list end to end: grouping, adding tasks in plain language,
 * managing sections, the completed fold, row actions and bulk-select mode.
 * Server actions are mocked; the components, stores and parser are real.
 * (Drag arithmetic is covered in order.test.ts.)
 */

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

jest.mock('@/lib/actions/tasks', () => ({
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleTaskCompletion: jest.fn(),
    updateTask: jest.fn(),
    updateTaskOrder: jest.fn(),
}))

jest.mock('@/lib/actions/sections', () => ({
    createSection: jest.fn(),
    deleteSection: jest.fn(),
    reorderSections: jest.fn(),
    updateSection: jest.fn(),
}))

jest.mock('@/lib/actions/tags', () => ({
    getTags: jest.fn().mockResolvedValue([{ id: 'g1', name: 'writing' }]),
    createTag: jest.fn(),
}))

jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn(), dismiss: jest.fn() }) }))

const base = { projectId: 'p1', createdAt: '2026-09-01T00:00:00.000Z', tags: [], subtasks: [], priority: null, dueDate: null }

const TASKS: TaskTableTask[] = [
    { ...base, id: 't1', title: 'Loose task', completed: false, sectionId: null, sortOrder: 0 },
    { ...base, id: 't2', title: 'Write the post', completed: false, sectionId: 's1', sortOrder: 0 },
    { ...base, id: 't3', title: 'Pick screenshots', completed: false, sectionId: 's1', sortOrder: 1 },
    { ...base, id: 't4', title: 'Record the demo', completed: false, sectionId: 's2', sortOrder: 0 },
    { ...base, id: 't5', title: 'Old finished thing', completed: true, sectionId: 's2', sortOrder: 1 },
]

const SECTIONS = [{ id: 's1', name: 'Marketing' }, { id: 's2', name: 'Product' }]

const renderList = (tasks = TASKS, sections = SECTIONS) =>
    render(<TaskList tasks={tasks} sections={sections} projectId="p1" storageKey={`test-${Math.random()}`} />)

const section = (name: string) => screen.getByRole('region', { name: 'Tasks' }).querySelector(`section[aria-label="${name}"]`) as HTMLElement
const titlesIn = (el: HTMLElement) => within(el).queryAllByRole('listitem').map(li => li.getAttribute('data-task-id'))

/** Radix menus open on pointer-down or a key, not a synthetic click — open them as a keyboard user would. */
const openMenu = (trigger: HTMLElement) => {
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'Enter' })
}

/** Press Undo on the latest toast. */
const pressUndo = () => {
    const [, options] = (toast as unknown as jest.Mock).mock.calls.at(-1)
    act(() => options.action.onClick())
}

beforeEach(() => {
    jest.clearAllMocks()
    useTaskDetailStore.getState().closePanel()
    useTaskSelectionStore.getState().clearSelection()
    useDeletedStore.setState({ ids: new Set() })
})

afterEach(() => {
    // Let any undo window still open close before the next test.
    act(() => jest.runOnlyPendingTimers())
    jest.useRealTimers()
})

describe('layout', () => {
    it('puts unsectioned tasks first, then each section in order, with open counts', () => {
        renderList()
        const region = screen.getByRole('region', { name: 'Tasks' })
        const ids = within(region).getAllByRole('listitem').map(li => li.getAttribute('data-task-id'))
        expect(ids).toEqual(['t1', 't2', 't3', 't4', 't5'])
        expect(titlesIn(section('Marketing'))).toEqual(['t2', 't3'])
        expect(within(section('Product')).getByText('1')).toBeInTheDocument()
    })

    it('keeps finished tasks in their section, below the open ones', () => {
        const tasks: TaskTableTask[] = [
            { ...base, id: 'd1', title: 'Shipped it', completed: true, sectionId: 's1', sortOrder: 0 },
            ...TASKS,
        ]
        renderList(tasks)
        expect(titlesIn(section('Marketing'))).toEqual(['t2', 't3', 'd1'])
        expect(titlesIn(section('Product'))).toEqual(['t4', 't5'])
        // No separate "Completed" group, and a section's count is its open tasks.
        expect(screen.queryByRole('button', { name: /Completed/ })).not.toBeInTheDocument()
        expect(within(section('Marketing')).getByText('2')).toBeInTheDocument()
        // Finished tasks don't drag.
        expect(screen.queryByRole('button', { name: 'Move “Shipped it”' })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Move “Write the post”' })).toBeInTheDocument()
    })

    it('collapses a section, remembering it for the other view too', () => {
        const key = `shared-${Math.random()}`
        const { unmount } = render(<TaskList tasks={TASKS} sections={SECTIONS} projectId="p1" storageKey={key} />)
        fireEvent.click(screen.getByRole('button', { name: 'Collapse Marketing' }))
        expect(screen.queryByText('Write the post')).not.toBeInTheDocument()
        unmount()

        render(<TaskList tasks={TASKS} sections={SECTIONS} projectId="p1" storageKey={key} />)
        expect(screen.getByRole('button', { name: 'Expand Marketing' })).toBeInTheDocument()
    })

    it('invites a first task in an empty project', () => {
        renderList([], [])
        expect(screen.getByText(/No tasks yet/)).toBeInTheDocument()
    })
})

describe('adding tasks', () => {
    it('understands plain language and files the task under its section', async () => {
        ;(createTask as jest.Mock).mockResolvedValue({ success: true, data: { id: 't9' } })
        renderList()
        await waitFor(() => expect(jest.requireMock('@/lib/actions/tags').getTags).toHaveBeenCalled())

        const marketing = section('Marketing')
        fireEvent.click(within(marketing).getByRole('button', { name: /Add task/ }))
        const input = within(marketing).getByLabelText('New task')
        fireEvent.change(input, { target: { value: 'Draft the post tomorrow p1 @writing' } })

        // What was understood is shown before it's saved.
        expect(within(marketing).getByText('Urgent')).toBeInTheDocument()

        await act(async () => fireEvent.keyDown(input, { key: 'Enter' }))

        const saved = (createTask as jest.Mock).mock.calls[0][0]
        expect(saved).toMatchObject({ title: 'Draft the post', projectId: 'p1', sectionId: 's1', priority: 'urgent', tagIds: ['g1'] })
        expect(saved.dueDate).toEqual(expect.any(String))
        // Shown at once, before the server answers.
        expect(within(marketing).getByText('Draft the post')).toBeInTheDocument()
    })
})

describe('sections', () => {
    it('renames a section in place', async () => {
        ;(updateSection as jest.Mock).mockResolvedValue({ success: true })
        renderList()
        fireEvent.click(screen.getByRole('button', { name: 'Marketing' }))
        const input = screen.getByLabelText('Section name')
        fireEvent.change(input, { target: { value: 'Launch' } })
        await act(async () => fireEvent.keyDown(input, { key: 'Enter' }))
        expect(updateSection).toHaveBeenCalledWith('s1', 'Launch')
        expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument()
    })

    it('adds a section at the end', async () => {
        ;(createSection as jest.Mock).mockResolvedValue({ success: true, data: { id: 's9' } })
        renderList()

        fireEvent.click(screen.getByRole('button', { name: 'Add section' }))
        const input = screen.getByLabelText('New section name')
        fireEvent.change(input, { target: { value: 'Design' } })
        await act(async () => fireEvent.keyDown(input, { key: 'Enter' }))

        expect(createSection).toHaveBeenCalledWith('p1', 'Design')
        expect(reorderSections).not.toHaveBeenCalled()
        const names = Array.from(document.querySelectorAll('section[aria-label]')).map(el => el.getAttribute('aria-label'))
        expect(names).toEqual(['Marketing', 'Product', 'Design'])
    })

    it('deletes a section at once, with Undo instead of a confirmation', async () => {
        jest.useFakeTimers()
        renderList()
        openMenu(within(section('Marketing')).getByRole('button', { name: 'Actions for Marketing' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: /Delete section/ }))

        // Gone straight away, its tasks moved to the top — and nothing saved yet.
        expect(document.querySelector('section[aria-label="Marketing"]')).toBeNull()
        expect(screen.getByText('Write the post')).toBeInTheDocument()
        expect(toast).toHaveBeenCalledWith('Section deleted', expect.objectContaining({ action: expect.objectContaining({ label: 'Undo' }) }))
        expect(deleteSection).not.toHaveBeenCalled()

        pressUndo()
        expect(section('Marketing')).not.toBeNull()
        await act(async () => jest.advanceTimersByTime(6000))
        expect(deleteSection).not.toHaveBeenCalled()
    })
})

describe('rows', () => {
    it('opens a task in the detail panel with its section', () => {
        renderList()
        fireEvent.click(screen.getByText('Pick screenshots'))
        const { selectedTaskId, selectedTask } = useTaskDetailStore.getState()
        expect(selectedTaskId).toBe('t3')
        expect(selectedTask.section.name).toBe('Marketing')
    })

    it('deletes from the row menu at once, and for good once the undo window passes', async () => {
        jest.useFakeTimers()
        ;(deleteTask as jest.Mock).mockResolvedValue({ success: true })
        renderList()
        openMenu(screen.getByRole('button', { name: 'Actions for “Loose task”' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }))

        expect(screen.queryByText('Loose task')).not.toBeInTheDocument()
        expect(toast).toHaveBeenCalledWith('Task deleted', expect.anything())
        expect(deleteTask).not.toHaveBeenCalled()

        await act(async () => jest.advanceTimersByTime(5000))
        expect(deleteTask).toHaveBeenCalledWith('t1')
        expect(refresh).toHaveBeenCalled()
        expect(screen.queryByText('Loose task')).not.toBeInTheDocument()
    })

    it('brings a deleted task back on Undo', async () => {
        jest.useFakeTimers()
        renderList()
        openMenu(screen.getByRole('button', { name: 'Actions for “Loose task”' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }))
        pressUndo()

        expect(screen.getByText('Loose task')).toBeInTheDocument()
        await act(async () => jest.advanceTimersByTime(6000))
        expect(deleteTask).not.toHaveBeenCalled()
    })

    it('selects instead of opening while in bulk-select mode', () => {
        useTaskSelectionStore.getState().setIsSelectionMode(true)
        renderList()
        fireEvent.click(screen.getByText('Record the demo'))
        expect(useTaskSelectionStore.getState().selectedIds.has('t4')).toBe(true)
        expect(useTaskDetailStore.getState().selectedTaskId).toBeNull()
    })
})
