import { findContainer, moveAcross, settleDrop, type Order } from '../order'

const ORDER: Order = {
    __none__: ['a'],
    s1: ['b', 'c', 'd'],
    s2: [],
}

describe('findContainer', () => {
    it('finds the list holding a task, or reads a container’s own id', () => {
        expect(findContainer('c', ORDER)).toBe('s1')
        expect(findContainer('container:s2', ORDER)).toBe('s2')
        expect(findContainer('missing', ORDER)).toBeUndefined()
    })
})

describe('moveAcross', () => {
    it('moves a task into another section, above the task it is over', () => {
        expect(moveAcross(ORDER, 'a', 'c')).toEqual({ __none__: [], s1: ['b', 'a', 'c', 'd'], s2: [] })
    })

    it('appends when over an empty section', () => {
        expect(moveAcross(ORDER, 'b', 'container:s2')).toEqual({ __none__: ['a'], s1: ['c', 'd'], s2: ['b'] })
    })

    it('leaves the order alone within one section', () => {
        expect(moveAcross(ORDER, 'b', 'd')).toBe(ORDER)
    })
})

describe('settleDrop', () => {
    it('reorders within a section', () => {
        expect(settleDrop(ORDER, ORDER, 's1', 'd', 'b')).toEqual({ container: 's1', ids: ['d', 'b', 'c'], moved: false })
    })

    it('reports a move between sections, with the final order', () => {
        const during = moveAcross(ORDER, 'a', 'container:s2')
        expect(settleDrop(during, ORDER, '__none__', 'a', 'container:s2')).toEqual({ container: 's2', ids: ['a'], moved: true })
    })

    it('saves nothing when the task lands where it started', () => {
        expect(settleDrop(ORDER, ORDER, 's1', 'c', 'c')).toBeNull()
    })
})
