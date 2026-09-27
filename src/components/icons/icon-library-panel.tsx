'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { icons, Search, type LucideIcon } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { lucideName, toLucideIcon } from '@/lib/icons'
import { FIELD_FOCUS, HAIRLINE, ICON, INK, NUM, R, T, TRANSITION } from '@/lib/second-brain/ui'

/**
 * The whole Lucide library, searchable.
 *
 * This module holds every icon component, so it's only ever loaded lazily —
 * by the picker, when it opens. The grid is virtualised: of ~1,700 icons, only
 * the rows in view (plus a few) are in the DOM.
 */

interface LibraryIcon {
    /** The kebab-case name from lucide.dev — what gets stored. */
    name: string
    Icon: LucideIcon
    /** The name as words, for matching. */
    words: string
}

const pascal = (name: string) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())

/**
 * One entry per icon. The dynamic-import map also lists old aliases
 * ("arrow-down-01" beside "arrow-down-0-1"); keep the first name for each icon.
 */
const LIBRARY: LibraryIcon[] = (() => {
    const seen = new Set<LucideIcon>()
    const list: LibraryIcon[] = []
    for (const name of Object.keys(dynamicIconImports).sort()) {
        const Icon = icons[pascal(name) as keyof typeof icons]
        if (!Icon || seen.has(Icon)) continue
        seen.add(Icon)
        list.push({ name, Icon, words: name.replace(/-/g, ' ') })
    }
    return list
})()

/** Every word of the query must appear; names that start with it rank first. */
function search(query: string): LibraryIcon[] {
    const q = query.trim().toLowerCase().replace(/[-_]+/g, ' ')
    if (!q) return LIBRARY
    const tokens = q.split(/\s+/)
    const hits = LIBRARY.filter(icon => tokens.every(t => icon.words.includes(t)))
    const rank = (icon: LibraryIcon) =>
        icon.words === q ? 0 : icon.words.startsWith(q) ? 1 : icon.words.split(' ').some(w => w.startsWith(tokens[0])) ? 2 : 3
    return hits.sort((a, b) => rank(a) - rank(b))
}

const COLUMNS = 8
const CELL = 36

export default function IconLibraryPanel({ value, onPick }: { value: string | null | undefined; onPick: (value: string) => void }) {
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)
    const [hovered, setHovered] = useState<string | null>(null)
    const field = useRef<HTMLInputElement>(null)
    const scroller = useRef<HTMLDivElement>(null)
    const grid = useRef<HTMLDivElement>(null)

    const results = useMemo(() => search(query), [query])
    const rows = Math.ceil(results.length / COLUMNS)
    const selected = lucideName(value)

    const virtualizer = useVirtualizer({
        count: rows,
        getScrollElement: () => scroller.current,
        estimateSize: () => CELL,
        overscan: 8,
    })

    const pick = (icon: LibraryIcon | undefined) => icon && onPick(toLucideIcon(icon.name))

    const cell = (index: number) => grid.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    const pendingFocus = useRef<number | null>(null)

    // A cell scrolled in from outside the rendered rows gets focus once it exists.
    useEffect(() => {
        if (pendingFocus.current === null) return
        const target = cell(pendingFocus.current)
        if (target) {
            target.focus()
            pendingFocus.current = null
        }
    })

    /** Move the keyboard cursor, keeping it in view and focused. */
    const moveTo = (index: number) => {
        const next = Math.max(0, Math.min(results.length - 1, index))
        setActive(next)
        const target = cell(next)
        if (target) target.focus()
        else {
            pendingFocus.current = next
            virtualizer.scrollToIndex(Math.floor(next / COLUMNS))
        }
    }

    const onGridKey = (e: KeyboardEvent) => {
        const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS }[e.key]
        if (step === undefined) return
        e.preventDefault()
        // Up from the first row goes back to the search field.
        if (step === -COLUMNS && active < COLUMNS) {
            field.current?.focus()
            return
        }
        moveTo(active + step)
    }

    const label = hovered ?? (results[active] && query ? results[active].name : selected)

    return (
        <div className="flex flex-col">
            <div className="relative mx-2 mb-2">
                <Search className={cn(ICON.md, INK.subtle, 'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2')} strokeWidth={2} />
                <input
                    ref={field}
                    autoFocus
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value)
                        setActive(0)
                        scroller.current?.scrollTo({ top: 0 })
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            pick(results[0])
                        }
                        if (e.key === 'ArrowDown' && results.length) {
                            e.preventDefault()
                            moveTo(0)
                        }
                    }}
                    placeholder={`Search ${LIBRARY.length.toLocaleString()} icons`}
                    aria-label="Search icons"
                    className={cn('h-8 w-full border bg-transparent pl-7 pr-2', R.md, HAIRLINE, T.body, INK.strong,
                        'placeholder:text-muted-foreground/60', FIELD_FOCUS)}
                />
            </div>

            <div ref={scroller} className="h-[252px] overflow-y-auto overscroll-contain px-2">
                {results.length === 0 ? (
                    <p className={cn('pt-16 text-center', T.body, INK.muted)}>No icons match “{query.trim()}”</p>
                ) : (
                    <div
                        ref={grid}
                        role="listbox"
                        aria-label="Icons"
                        onKeyDown={onGridKey}
                        onPointerLeave={() => setHovered(null)}
                        className="relative w-full"
                        style={{ height: virtualizer.getTotalSize() }}
                    >
                        {virtualizer.getVirtualItems().map(row => (
                            <div
                                key={row.key}
                                className="absolute inset-x-0 grid"
                                style={{ top: row.start, height: CELL, gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
                            >
                                {results.slice(row.index * COLUMNS, row.index * COLUMNS + COLUMNS).map((icon, i) => {
                                    const index = row.index * COLUMNS + i
                                    const isSelected = icon.name === selected
                                    return (
                                        <button
                                            key={icon.name}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            aria-label={icon.name}
                                            data-index={index}
                                            tabIndex={index === active ? 0 : -1}
                                            onClick={() => pick(icon)}
                                            onFocus={() => setActive(index)}
                                            onPointerEnter={() => setHovered(icon.name)}
                                            className={cn(
                                                'm-auto flex h-8 w-8 items-center justify-center outline-none', R.md, TRANSITION.fast,
                                                'hover:bg-black/[0.05] focus-visible:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-primary/40',
                                                'dark:hover:bg-white/[0.07] dark:focus-visible:bg-white/[0.08]',
                                                isSelected ? 'bg-primary/12 text-primary' : INK.default
                                            )}
                                        >
                                            <icon.Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={cn('mt-1 flex h-8 items-center justify-between gap-2 border-t px-3', HAIRLINE, T.meta)}>
                <span className={cn('truncate', label ? INK.default : INK.subtle)}>{label ?? 'Pick an icon'}</span>
                {query && <span className={cn('shrink-0', NUM, INK.subtle)}>{results.length.toLocaleString()}</span>}
            </div>
        </div>
    )
}
