import type { ColumnDef, SortState, SortValue } from './types'

/**
 * Pure sorting helpers for the data table, kept apart from the component so
 * they can be tested directly.
 */

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const isMissing = (value: SortValue): value is null | undefined => value === null || value === undefined

/**
 * Order two values. Missing values go last whichever way the column is sorted:
 * a task with no due date is never "earliest" or "latest", it just has none.
 */
export function compareValues(a: SortValue, b: SortValue, direction: 'asc' | 'desc'): number {
    if (isMissing(a) || isMissing(b)) {
        if (isMissing(a) && isMissing(b)) return 0
        return isMissing(a) ? 1 : -1
    }

    const order = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : collator.compare(String(a), String(b))

    return direction === 'asc' ? order : -order
}

/**
 * Sort rows by a column. Stable — rows that compare equal keep the order they
 * arrived in, which is the caller's own ("manual") order.
 */
export function sortRows<Row>(rows: Row[], column: ColumnDef<Row> | undefined, direction: 'asc' | 'desc'): Row[] {
    const valueOf = column?.sortValue
    if (!valueOf) return rows

    return rows
        .map((row, index) => ({ row, index, value: valueOf(row) }))
        .sort((a, b) => compareValues(a.value, b.value, direction) || a.index - b.index)
        .map(entry => entry.row)
}

/**
 * What clicking a column header does next: sort by it in its natural direction,
 * then the other way, then back to no sort at all.
 */
export function nextSort<Row>(current: SortState | null, column: ColumnDef<Row>): SortState | null {
    const first = column.defaultDirection ?? 'asc'

    if (current?.columnId !== column.id) return { columnId: column.id, direction: first }
    if (current.direction === first) return { columnId: column.id, direction: first === 'asc' ? 'desc' : 'asc' }
    return null
}

/** The CSS grid track list for a set of columns, shared by the header and every row. */
export function gridTemplate<Row>(columns: ColumnDef<Row>[]): string {
    return columns
        .map(column => (column.width === 'fill' ? `minmax(${column.minWidth ?? 160}px, 1fr)` : `${column.width}px`))
        .join(' ')
}

/** The narrowest the table can be before it scrolls sideways. */
export function minTableWidth<Row>(columns: ColumnDef<Row>[]): number {
    return columns.reduce((sum, column) => sum + (column.width === 'fill' ? column.minWidth ?? 160 : column.width), 0)
}
