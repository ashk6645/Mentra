import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { AppIcon } from '../app-icon'

/** The real map lazily imports ~1,900 icon modules; two stand-ins are enough here. */
const load = jest.fn(() => Promise.resolve({ __iconNode: [['circle', { cx: '12', cy: '12', r: '10', key: 'c' }]] }))
jest.mock('lucide-react/dynamicIconImports', () => ({ __esModule: true, default: { 'circle-dot': () => load() } }), { virtual: true })

it('renders an emoji as text, and a fallback when empty', () => {
    const { container, rerender } = render(<AppIcon value="🚀" />)
    expect(container).toHaveTextContent('🚀')
    rerender(<AppIcon value={null} />)
    expect(container).toHaveTextContent('📁')
})

it('loads a Lucide icon once, then renders it straight away', async () => {
    const first = render(<AppIcon value="lucide:circle-dot" className="text-red-500" />)
    // A same-sized placeholder while it loads, so nothing shifts.
    expect(first.container.querySelector('svg')).toBeNull()
    await waitFor(() => expect(first.container.querySelector('svg circle')).toBeInTheDocument())
    expect(first.container.querySelector('svg')).toHaveClass('text-red-500')

    const second = render(<AppIcon value="lucide:circle-dot" />)
    expect(second.container.querySelector('svg circle')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(1)
})

it('leaves an unknown name as a blank placeholder', async () => {
    const { container } = render(<AppIcon value="lucide:not-an-icon" />)
    await new Promise(r => setTimeout(r, 0))
    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstChild).toHaveClass('h-[1em]')
})
