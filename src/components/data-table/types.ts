import type { ReactNode } from 'react'

/**
 * Types for the generic data table.
 *
 * The table knows nothing about tasks, projects or any other domain. A caller
 * describes its columns once and hands over rows; sorting, grouping, layout and
 * keyboard movement are the table's job. That split is what lets the same table
 * serve tasks today and anything else later.
 */

export type SortDirection = 'asc' | 'desc'

export interface SortState {
    columnId: string
    direction: SortDirection
}

/** What a column sorts by. `null` and `undefined` always sort last, either way. */
export type SortValue = string | number | null | undefined

export interface ColumnDef<Row> {
    id: string
    /** Header text. Empty for a column that explains itself, like a checkbox. */
    header: string
    /** Name in the column picker, when the header is empty or abbreviated. */
    label?: string
    /** Fixed width in px, or `'fill'` for the column that takes the spare room. */
    width: number | 'fill'
    /** Floor for a `'fill'` column, so it never collapses. */
    minWidth?: number
    align?: 'start' | 'center' | 'end'
    /** Present means sortable. */
    sortValue?: (row: Row) => SortValue
    /** The direction a first click sorts in — dates ascend, priority descends. */
    defaultDirection?: SortDirection
    /** Whether the column picker may hide it. */
    hideable?: boolean
    cell: (row: Row) => ReactNode
}

export interface RowGroup<Row> {
    id: string
    label: ReactNode
    rows: Row[]
    /** Rendered after the group's rows while it is open — an "add row" line, say. */
    footer?: ReactNode
}
