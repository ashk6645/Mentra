import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { TaskList } from '../task-list'
import { createTask, deleteTask } from '@/lib/actions/tasks'
import { createSection, deleteSection, reorderSections, updateSection } from '@/lib/actions/sections'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { useTaskSelectionStore } from '@/stores/use-task-selection-store'
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

jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }))

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

/** Confirm the open dialog with its action button. */
const confirmDialog = async (label: string) => {
    const dialog = await screen.findByRole('dialog')
    await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: label })))
}

beforeEach(() => {
    jest.clearAllMocks()
    useTaskDetailStore.getState().closePanel()
    useTaskSelectionStore.getState().clearSelection()
})

describe('layout', () => {
    it('puts unsectioned tasks first, then each section in order, with open counts', () => {
        renderList()
        const region = screen.getByRole('region', { name: 'Tasks' })
        const ids = within(region).getAllByRole('listitem').map(li => li.getAttribute('data-task-id'))
        expect(ids).toEqual(['t1', 't2', 't3', 't4'])
        expect(titlesIn(section('Marketing'))).toEqual(['t2', 't3'])
        expect(within(section('Product')).getByText('1')).toBeInTheDocument()
    })

    it('folds completed work away until asked for', () => {
        renderList()
        expect(screen.queryByText('Old finished thing')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: /Completed/ }))
        expect(screen.getByText('Old finished thing')).toBeInTheDocument()
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

    it('adds a section between two others, then puts it in place', async () => {
        ;(createSection as jest.Mock).mockResolvedValue({ success: true, data: { id: 's9' } })
        ;(reorderSections as jest.Mock).mockResolvedValue({ success: true })
        renderList()

        // The gap before "Product" is the second one.
        fireEvent.click(screen.getAllByRole('button', { name: 'Add section' })[1])
        const input = screen.getByLabelText('New section name')
        fireEvent.change(input, { target: { value: 'Design' } })
        await act(async () => fireEvent.keyDown(input, { key: 'Enter' }))

        expect(createSection).toHaveBeenCalledWith('p1', 'Design')
        expect(reorderSections).toHaveBeenCalledWith('p1', ['s1', 's9', 's2'])
    })

    it('asks before deleting a section, and says its tasks stay', async () => {
        ;(deleteSection as jest.Mock).mockResolvedValue({ success: true })
        renderList()
        openMenu(within(section('Marketing')).getByRole('button', { name: 'Actions for Marketing' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: /Delete section/ }))

        expect(await screen.findByText(/2 tasks stay in the project/)).toBeInTheDocument()
        await confirmDialog('Delete section')
        expect(deleteSection).toHaveBeenCalledWith('s1')
        // Its tasks move to the top straight away.
        // (Queried directly: role queries skip content behind the still-closing dialog.)
        expect(document.querySelector('section[aria-label="Marketing"]')).toBeNull()
        expect(screen.getByText('Write the post')).toBeInTheDocument()
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

    it('deletes from the row menu after confirming, hiding it at once', async () => {
        ;(deleteTask as jest.Mock).mockResolvedValue({ success: true })
        renderList()
        openMenu(screen.getByRole('button', { name: 'Actions for “Loose task”' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }))
        await confirmDialog('Delete task')

        expect(deleteTask).toHaveBeenCalledWith('t1')
        expect(screen.queryByText('Loose task')).not.toBeInTheDocument()
    })

    it('selects instead of opening while in bulk-select mode', () => {
        useTaskSelectionStore.getState().setIsSelectionMode(true)
        renderList()
        fireEvent.click(screen.getByText('Record the demo'))
        expect(useTaskSelectionStore.getState().selectedIds.has('t4')).toBe(true)
        expect(useTaskDetailStore.getState().selectedTaskId).toBeNull()
    })
})
