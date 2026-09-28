import { toast } from 'sonner'
import { undoLast, withUndo } from '../undo'

jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { dismiss: jest.fn() }) }))

/** The options passed with the latest toast. */
const lastToast = () => (toast as unknown as jest.Mock).mock.calls.at(-1)[1]

const pressKey = (init: KeyboardEventInit, target: EventTarget = window) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))

beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
})

afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
})

const action = () => ({ undo: jest.fn(), commit: jest.fn() })

it('commits once the window passes, not before', () => {
    const a = action()
    withUndo({ message: 'Task deleted', ...a })
    expect(toast).toHaveBeenCalledWith('Task deleted', expect.objectContaining({ duration: 5000 }))

    jest.advanceTimersByTime(4999)
    expect(a.commit).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(a.commit).toHaveBeenCalledTimes(1)
    expect(a.undo).not.toHaveBeenCalled()
})

it('undoes from the toast, and then never commits', () => {
    const a = action()
    withUndo({ message: 'Task deleted', ...a })
    lastToast().action.onClick()

    expect(a.undo).toHaveBeenCalledTimes(1)
    expect(toast.dismiss).toHaveBeenCalled()
    jest.advanceTimersByTime(10000)
    expect(a.commit).not.toHaveBeenCalled()
})

it('commits straight away when the toast is closed early', () => {
    const a = action()
    withUndo({ message: 'Task deleted', ...a })
    lastToast().onDismiss()
    expect(a.commit).toHaveBeenCalledTimes(1)
})

it('takes back the latest first with ⌘Z / Ctrl+Z', () => {
    const first = action()
    const second = action()
    withUndo({ message: 'one', ...first })
    withUndo({ message: 'two', ...second })

    pressKey({ key: 'z', metaKey: true })
    expect(second.undo).toHaveBeenCalled()
    expect(first.undo).not.toHaveBeenCalled()

    pressKey({ key: 'z', ctrlKey: true })
    expect(first.undo).toHaveBeenCalled()
    expect(undoLast()).toBe(false)
})

it('leaves ⌘Z to a text field being typed in', () => {
    const a = action()
    withUndo({ message: 'Task deleted', ...a })
    const input = document.body.appendChild(document.createElement('input'))

    pressKey({ key: 'z', metaKey: true }, input)
    expect(a.undo).not.toHaveBeenCalled()
    input.remove()
})
