import { compareValues, gridTemplate, minTableWidth, nextSort, sortRows } from '../sort'
import type { ColumnDef } from '../types'

interface Row {
    id: string
    name: string
    due: string | null
    rank: number
}

const column = (over: Partial<ColumnDef<Row>> = {}): ColumnDef<Row> => ({
    id: 'due', header: 'Due', width: 120, cell: () => null, sortValue: r => r.due, ...over,
})

const rows: Row[] = [
    { id: 'a', name: 'Task 10', due: '2026-10-03', rank: 1 },
    { id: 'b', name: 'task 2', due: null, rank: 3 },
    { id: 'c', name: 'Task 1', due: '2026-10-01', rank: 3 },
    { id: 'd', name: 'Task 3', due: null, rank: 0 },
]

describe('compareValues', () => {
    it('puts missing values last in both directions', () => {
        expect(compareValues(null, 'x', 'asc')).toBeGreaterThan(0)
        expect(compareValues(null, 'x', 'desc')).toBeGreaterThan(0)
        expect(compareValues(undefined, null, 'asc')).toBe(0)
    })

    it('compares numbers numerically and text naturally', () => {
        expect(compareValues(2, 10, 'asc')).toBeLessThan(0)
        expect(compareValues('Task 2', 'Task 10', 'asc')).toBeLessThan(0)
        expect(compareValues('apple', 'Apple', 'asc')).toBe(0)
    })
})

describe('sortRows', () => {
    it('sorts dates ascending with undated rows last', () => {
        expect(sortRows(rows, column(), 'asc').map(r => r.id)).toEqual(['c', 'a', 'b', 'd'])
    })

    it('keeps undated rows last when descending too', () => {
        expect(sortRows(rows, column(), 'desc').map(r => r.id)).toEqual(['a', 'c', 'b', 'd'])
    })

    it('is stable: ties keep their original order', () => {
        const byRank = column({ id: 'rank', sortValue: r => r.rank })
        expect(sortRows(rows, byRank, 'desc').map(r => r.id)).toEqual(['b', 'c', 'a', 'd'])
    })

    it('sorts text in natural order, ignoring case', () => {
        const byName = column({ id: 'name', sortValue: r => r.name })
        expect(sortRows(rows, byName, 'asc').map(r => r.name)).toEqual(['Task 1', 'task 2', 'Task 3', 'Task 10'])
    })

    it('leaves rows alone for a column that cannot sort', () => {
        expect(sortRows(rows, column({ sortValue: undefined }), 'asc')).toBe(rows)
    })
})

describe('nextSort', () => {
    it('cycles natural direction, then reverse, then off', () => {
        const priority = column({ id: 'priority', defaultDirection: 'desc' })
        const first = nextSort(null, priority)
        expect(first).toEqual({ columnId: 'priority', direction: 'desc' })
        const second = nextSort(first, priority)
        expect(second).toEqual({ columnId: 'priority', direction: 'asc' })
        expect(nextSort(second, priority)).toBeNull()
    })

    it('starts fresh when switching to another column', () => {
        expect(nextSort({ columnId: 'priority', direction: 'asc' }, column())).toEqual({ columnId: 'due', direction: 'asc' })
    })
})

describe('layout', () => {
    const columns = [column({ width: 44 }), column({ id: 'title', width: 'fill', minWidth: 240 }), column({ width: 120 })]

    it('builds one track list for header and rows', () => {
        expect(gridTemplate(columns)).toBe('44px minmax(240px, 1fr) 120px')
    })

    it('knows the width below which it must scroll', () => {
        expect(minTableWidth(columns)).toBe(404)
    })
})
