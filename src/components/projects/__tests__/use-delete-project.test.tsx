import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { useDeleteProject } from '../use-delete-project'
import { deleteProject } from '@/lib/actions/projects'

/**
 * Deleting a project: where you end up depends on where you were. Inside the
 * project, you land on /projects — and must leave *before* the delete runs, or
 * its refresh re-renders a page that no longer exists.
 */

const replace = jest.fn()
const refresh = jest.fn()
let pathname = '/'
jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace, refresh }),
    usePathname: () => pathname,
}))

jest.mock('@/lib/actions/projects', () => ({ deleteProject: jest.fn() }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const run = async (at: string, id = 'p1') => {
    pathname = at
    const { result } = renderHook(() => useDeleteProject())
    let ok = false
    await act(async () => {
        ok = await result.current(id)
    })
    return ok
}

beforeEach(() => {
    jest.clearAllMocks()
    ;(deleteProject as jest.Mock).mockResolvedValue({ success: true })
})

it('leaves for /projects before deleting the project you are in', async () => {
    expect(await run('/projects/p1')).toBe(true)

    expect(replace).toHaveBeenCalledWith('/projects')
    expect(deleteProject).toHaveBeenCalledWith('p1', 'hard')
    expect(replace.mock.invocationCallOrder[0]).toBeLessThan((deleteProject as jest.Mock).mock.invocationCallOrder[0])
    expect(toast.success).toHaveBeenCalledWith('Project deleted')
})

it('counts a page nested inside the project as being in it', async () => {
    await run('/projects/p1/settings')
    expect(replace).toHaveBeenCalledWith('/projects')
})

it('stays on the page when the project deleted is another one', async () => {
    await run('/projects/p10')
    await run('/today')

    expect(replace).not.toHaveBeenCalled()
    expect(deleteProject).toHaveBeenCalledTimes(2)
    expect(refresh).toHaveBeenCalledTimes(2)
})

it('reports a failure', async () => {
    ;(deleteProject as jest.Mock).mockResolvedValue({ success: false, error: 'Project not found' })
    expect(await run('/today')).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('Project not found')
    expect(refresh).not.toHaveBeenCalled()
})
