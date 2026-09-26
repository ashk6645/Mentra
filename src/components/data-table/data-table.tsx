'use client'

import { memo, useCallback, useEffect, useMemo, useRef, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { gridTemplate, minTableWidth, nextSort, sortRows } from './sort'
import type { ColumnDef, RowGroup, SortState } from './types'
import { CARD, DIVIDE, FOCUS, HAIRLINE, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

/**
 * A generic, keyboard-friendly data table.
 *
 * Built on CSS grid rather than `<table>`: every row shares one track list, so
 * columns line up exactly while each row stays a single focusable element that
 * can be clicked, opened with Enter, and moved between with the arrow keys.
 * ARIA grid roles give it the semantics a `<table>` would have had.
 *
 * Rows are memoised and every callback handed to them is stable, so editing one
 * cell re-renders one row — not the table.
 */

type RowAttributes = HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | undefined>

export interface DataTableProps<Row> {
    ariaLabel: string
    /** Visible columns, in order. Keep the array stable between renders. */
    columns: ColumnDef<Row>[]
    /** Flat rows. Ignored when `groups` is given. */
    rows?: Row[]
    /** Grouped rows, each under its own header. */
    groups?: RowGroup<Row>[]
    getRowId: (row: Row) => string
    sort: SortState | null
    onSortChange: (next: SortState | null) => void
    /** Clicking a row, or Enter on it. */
    onRowOpen?: (row: Row) => void
    /** Extra attributes for a row element — `data-*` hooks for app-wide shortcuts. */
    getRowAttributes?: (row: Row) => RowAttributes
    /** The row currently open elsewhere, e.g. in a detail panel. */
    activeRowId?: string | null
    isRowMuted?: (row: Row) => boolean
    collapsedGroups?: ReadonlySet<string>
    onToggleGroup?: (groupId: string) => void
    /** Shown in place of rows when there are none. */
    empty?: ReactNode
    /** After every row and group — a "new row" line, say. */
    footer?: ReactNode
    className?: string
}

/**
 * Did this click land on a control inside the row? Those handle themselves; the
 * row only opens when the click was on the row's own surface.
 */
function isFromControl(event: MouseEvent<HTMLElement>): boolean {
    const control = (event.target as HTMLElement).closest('button, a, input, textarea, select, [role="menuitem"], [data-row-control]')
    return control !== null && control !== event.currentTarget
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface DataRowProps<Row> {
    row: Row
    columns: ColumnDef<Row>[]
    template: string
    active: boolean
    muted: boolean
    attributes?: RowAttributes
    onOpen: (row: Row) => void
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>, row: Row) => void
}

function DataRowInner<Row>({ row, columns, template, active, muted, attributes, onOpen, onKeyDown }: DataRowProps<Row>) {
    return (
        <div
            role="row"
            tabIndex={0}
            data-table-row=""
            aria-selected={active}
            {...attributes}
            onClick={event => {
                if (!isFromControl(event)) onOpen(row)
            }}
            onKeyDown={event => onKeyDown(event, row)}
            style={{ gridTemplateColumns: template }}
            className={cn(
                'group/row grid h-10 cursor-default items-center', TRANSITION.fast,
                FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0',
                active
                    ? 'bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'hover:bg-black/[0.022] dark:hover:bg-white/[0.03]',
                muted && 'text-muted-foreground'
            )}
        >
            {columns.map(column => (
                <div
                    key={column.id}
                    role="gridcell"
                    className={cn(
                        'flex h-full min-w-0 items-center px-3',
                        column.align === 'center' && 'justify-center',
                        column.align === 'end' && 'justify-end'
                    )}
                >
                    {column.cell(row)}
                </div>
            ))}
        </div>
    )
}

/** Generic `memo` loses the type parameter; this restores it. */
const DataRow = memo(DataRowInner) as typeof DataRowInner

// ─── Table ───────────────────────────────────────────────────────────────────

export function DataTable<Row>({
    ariaLabel,
    columns,
    rows,
    groups,
    getRowId,
    sort,
    onSortChange,
    onRowOpen,
    getRowAttributes,
    activeRowId,
    isRowMuted,
    collapsedGroups,
    onToggleGroup,
    empty,
    footer,
    className,
}: DataTableProps<Row>) {
    const gridRef = useRef<HTMLDivElement>(null)
    const template = useMemo(() => gridTemplate(columns), [columns])
    const minWidth = useMemo(() => minTableWidth(columns), [columns])

    // Always call the latest handler without changing the function each row is
    // given — a new function per render would defeat the row memo.
    const openRef = useRef(onRowOpen)
    useEffect(() => {
        openRef.current = onRowOpen
    })
    const open = useCallback((row: Row) => openRef.current?.(row), [])

    /** Enter opens; the arrows move between rows without leaving the keyboard. */
    const onRowKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>, row: Row) => {
        if (event.target !== event.currentTarget) return

        if (event.key === 'Enter') {
            event.preventDefault()
            openRef.current?.(row)
            return
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        event.preventDefault()

        const all = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('[data-table-row]') ?? [])
        const index = all.indexOf(event.currentTarget)
        all[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus()
    }, [])

    const sortColumn = sort ? columns.find(column => column.id === sort.columnId) : undefined

    const sections = useMemo(() => {
        const sortIn = (list: Row[]) => (sort ? sortRows(list, sortColumn, sort.direction) : list)
        if (groups) return groups.map(group => ({ ...group, rows: sortIn(group.rows) }))
        return [{ id: '', label: null, rows: sortIn(rows ?? []), footer: undefined }]
    }, [groups, rows, sort, sortColumn])

    const hasRows = sections.some(section => section.rows.length > 0)
    const grouped = groups !== undefined

    const renderRow = (row: Row) => {
        const id = getRowId(row)
        return (
            <DataRow
                key={id}
                row={row}
                columns={columns}
                template={template}
                active={activeRowId === id}
                muted={isRowMuted?.(row) ?? false}
                attributes={getRowAttributes?.(row)}
                onOpen={open}
                onKeyDown={onRowKeyDown}
            />
        )
    }

    return (
        <div className={cn(R.lg, CARD, 'overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <div ref={gridRef} role="grid" aria-label={ariaLabel} aria-rowcount={-1} style={{ minWidth }}>
                    {/* Header */}
                    <div
                        role="row"
                        style={{ gridTemplateColumns: template }}
                        className={cn('grid h-9 items-center border-b bg-black/[0.018] dark:bg-white/[0.02]', HAIRLINE)}
                    >
                        {columns.map(column => {
                            const sorted = sort?.columnId === column.id ? sort.direction : null
                            const label = (
                                <span className={cn(T.caption, 'text-[12px]', sorted ? INK.strong : INK.muted)}>{column.header}</span>
                            )

                            return (
                                <div
                                    key={column.id}
                                    role="columnheader"
                                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                                    className={cn(
                                        'flex h-full min-w-0 items-center px-3',
                                        column.align === 'center' && 'justify-center',
                                        column.align === 'end' && 'justify-end'
                                    )}
                                >
                                    {column.sortValue && column.header ? (
                                        <button
                                            type="button"
                                            onClick={() => onSortChange(nextSort(sort, column))}
                                            className={cn(
                                                'group/sort -mx-1.5 flex h-7 min-w-0 items-center gap-1 px-1.5', R.md, TRANSITION.fast, FOCUS,
                                                'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                                            )}
                                            title={`Sort by ${column.label ?? column.header}`}
                                        >
                                            {label}
                                            {sorted === 'desc' ? (
                                                <ArrowDown className={cn(ICON.sm, INK.default)} strokeWidth={2.25} />
                                            ) : (
                                                <ArrowUp
                                                    className={cn(
                                                        ICON.sm, TRANSITION.fast,
                                                        sorted ? INK.default : 'opacity-0 group-hover/sort:opacity-40'
                                                    )}
                                                    strokeWidth={2.25}
                                                />
                                            )}
                                        </button>
                                    ) : (
                                        label
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Body */}
                    {!hasRows && empty ? (
                        empty
                    ) : (
                        sections.map(section => {
                            const collapsed = grouped && (collapsedGroups?.has(section.id) ?? false)

                            return (
                                <div key={section.id || 'rows'} role="rowgroup">
                                    {grouped && (
                                        <div role="row" className={cn('border-b', HAIRLINE)}>
                                            <button
                                                type="button"
                                                onClick={() => onToggleGroup?.(section.id)}
                                                aria-expanded={!collapsed}
                                                className={cn(
                                                    'flex h-9 w-full items-center gap-2 px-3 text-left', TRANSITION.fast,
                                                    'bg-black/[0.012] hover:bg-black/[0.03] dark:bg-white/[0.015] dark:hover:bg-white/[0.035]',
                                                    FOCUS, 'focus-visible:ring-inset focus-visible:ring-offset-0'
                                                )}
                                            >
                                                <ChevronRight
                                                    className={cn(ICON.sm, INK.subtle, 'transition-transform duration-200', !collapsed && 'rotate-90')}
                                                    strokeWidth={2.25}
                                                />
                                                <span className={cn(T.body, 'font-medium', INK.strong)}>{section.label}</span>
                                                <span className={cn(T.meta, NUM, INK.subtle)}>{section.rows.length}</span>
                                            </button>
                                        </div>
                                    )}

                                    {!collapsed && (
                                        <div className={cn('divide-y border-b', DIVIDE, HAIRLINE)}>
                                            {section.rows.map(renderRow)}
                                            {section.footer}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}

                    {footer}
                </div>
            </div>
        </div>
    )
}
