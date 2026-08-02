'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    type KeyboardCoordinateGetter,
    MouseSensor,
    TouchSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ColumnId = 'todo' | 'inprogress' | 'done'

interface KanbanCard {
    id: string
    title: string
    columnId: ColumnId
}

/**
 * Column definitions.
 *
 * The accent colours are deliberately fixed rather than theme tokens: they encode
 * status — not started, in flight, finished — and status should read identically
 * whichever of Mentra's themes is active. Everything *else* here uses semantic
 * tokens, so the board takes on the theme's surfaces and text.
 */
const COLUMNS = [
    {
        id: 'todo' as ColumnId,
        label: 'To do',
        addLabel: 'Add card',
        dot: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        accent: 'bg-amber-500',
        addButton: 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10',
        ring: 'focus-visible:ring-amber-500/40',
        confirm: 'bg-amber-500 hover:bg-amber-500/90 text-white',
    },
    {
        id: 'inprogress' as ColumnId,
        label: 'In progress',
        addLabel: 'Add card',
        dot: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        accent: 'bg-blue-500',
        addButton: 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10',
        ring: 'focus-visible:ring-blue-500/40',
        confirm: 'bg-blue-500 hover:bg-blue-500/90 text-white',
    },
    {
        id: 'done' as ColumnId,
        label: 'Done',
        addLabel: 'Add card',
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500',
        addButton: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
        ring: 'focus-visible:ring-emerald-500/40',
        confirm: 'bg-emerald-500 hover:bg-emerald-500/90 text-white',
    },
]

type Column = (typeof COLUMNS)[number]

const columnById = (id: ColumnId) => COLUMNS.find(c => c.id === id)!
const isColumnId = (id: string): id is ColumnId => COLUMNS.some(c => c.id === id)

const INITIAL_CARDS: KanbanCard[] = [
    { id: 'c1', title: 'Sketch the video outline', columnId: 'todo' },
    { id: 'c2', title: 'Record voiceover', columnId: 'todo' },
    { id: 'c3', title: 'Edit rough cut', columnId: 'inprogress' },
    { id: 'c4', title: 'Publish thumbnail', columnId: 'done' },
]

// ─── Card ────────────────────────────────────────────────────────────────────

function CardShell({
    card,
    column,
    onDelete,
    dragging = false,
    overlay = false,
    setNodeRef,
    style,
    handleProps,
}: {
    card: KanbanCard
    column: Column
    onDelete?: (id: string) => void
    dragging?: boolean
    overlay?: boolean
    setNodeRef?: (node: HTMLElement | null) => void
    style?: React.CSSProperties
    handleProps?: Record<string, unknown>
}) {
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative flex items-center gap-2 overflow-hidden rounded-lg border pl-4 pr-2 py-2.5',
                'bg-card border-border shadow-sm transition-shadow select-none',
                dragging && !overlay && 'opacity-40',
                overlay && 'rotate-1 shadow-2xl ring-1 ring-foreground/10',
                !overlay && 'hover:shadow-md'
            )}
        >
            {/*
             * The status accent is its own element rather than `border-l-*`.
             * As a border it was silently overridden by the card's own border
             * colour in dark mode, so the one signal telling you which column a
             * card belongs to vanished exactly where the app is used most. A
             * positioned strip cannot be overridden by a shorthand.
             */}
            <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', column.accent)} />

            {/*
             * Only this region initiates a drag. Spreading the listeners over the
             * whole card would swallow clicks on the delete button and make text
             * impossible to select.
             */}
            <span
                {...handleProps}
                className={cn(
                    'flex-1 text-sm font-medium leading-snug text-foreground',
                    !overlay && 'cursor-grab active:cursor-grabbing',
                    'rounded-sm outline-none focus-visible:ring-2', column.ring,
                    card.columnId === 'done' && 'text-muted-foreground line-through'
                )}
            >
                {card.title}
            </span>

            {!overlay && onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(card.id)}
                    aria-label={`Delete ${card.title}`}
                    className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                        'text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground',
                        // Visible on touch. Hover-only made this unreachable on a
                        // phone, where there is no hover to reveal it.
                        'opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100',
                        'outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    )
}

function SortableCard({
    card,
    onDelete,
}: {
    card: KanbanCard
    onDelete: (id: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
    })

    return (
        <CardShell
            card={card}
            column={columnById(card.columnId)}
            onDelete={onDelete}
            dragging={isDragging}
            setNodeRef={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            handleProps={{ ...attributes, ...listeners }}
        />
    )
}

// ─── Inline add ──────────────────────────────────────────────────────────────

function InlineAddInput({
    column,
    onAdd,
    onCancel,
}: {
    column: Column
    onAdd: (title: string) => void
    onCancel: () => void
}) {
    const [value, setValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const submit = () => {
        const title = value.trim()
        if (title) onAdd(title)
        else onCancel()
    }

    return (
        <div className="mt-2 flex flex-col gap-2">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') submit()
                    if (e.key === 'Escape') onCancel()
                }}
                onBlur={submit}
                placeholder="Card title…"
                aria-label={`New card in ${column.label}`}
                className={cn(
                    'h-9 w-full rounded-lg border px-3 text-sm shadow-sm transition',
                    'border-border bg-card text-foreground placeholder:text-muted-foreground',
                    'outline-none focus-visible:ring-2', column.ring
                )}
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    // `onMouseDown` — the input's blur would otherwise unmount this
                    // button before its click ever landed.
                    onMouseDown={e => e.preventDefault()}
                    onClick={submit}
                    className={cn('h-8 flex-1 rounded-lg text-xs font-semibold transition', column.confirm)}
                >
                    Add card
                </button>
                <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={onCancel}
                    aria-label="Cancel"
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({
    column,
    cards,
    onDelete,
    onAddCard,
}: {
    column: Column
    cards: KanbanCard[]
    onDelete: (id: string) => void
    onAddCard: (columnId: ColumnId, title: string) => void
}) {
    const { isOver, setNodeRef } = useDroppable({ id: column.id })
    const [isAdding, setIsAdding] = useState(false)

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex h-full flex-col rounded-2xl border p-4 transition-colors',
                'border-border bg-muted/40',
                isOver && 'border-foreground/20 bg-muted/80'
            )}
        >
            <div className="mb-3 flex items-center gap-2">
                <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-full', column.dot)} />
                <h3 className={cn('text-[11px] font-bold uppercase tracking-widest', column.text)}>
                    {column.label}
                </h3>
                <span className="ml-auto min-w-[20px] rounded-full bg-foreground/[0.07] px-2 py-0.5 text-center text-xs font-semibold text-muted-foreground">
                    {cards.length}
                </span>
            </div>

            {/*
             * `flex-1` so the droppable fills the column and every lane is the
             * same height. Previously columns were `h-fit`, which made a nearly
             * empty column a thin strip that was genuinely hard to hit.
             */}
            <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex min-h-[72px] flex-1 flex-col gap-2">
                    {cards.length === 0 ? (
                        <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                            Drop a card here
                        </p>
                    ) : (
                        cards.map(card => (
                            <SortableCard key={card.id} card={card} onDelete={onDelete} />
                        ))
                    )}
                </div>
            </SortableContext>

            {isAdding ? (
                <InlineAddInput
                    column={column}
                    onAdd={title => {
                        onAddCard(column.id, title)
                        setIsAdding(false)
                    }}
                    onCancel={() => setIsAdding(false)}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className={cn(
                        'mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold',
                        'transition-colors outline-none focus-visible:ring-2', column.addButton, column.ring
                    )}
                >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    {column.addLabel}
                </button>
            )}
        </div>
    )
}

// ─── Board ───────────────────────────────────────────────────────────────────

export function KanbanBoard() {
    const [cards, setCards] = useState<KanbanCard[]>(INITIAL_CARDS)
    const [activeId, setActiveId] = useState<string | null>(null)

    /*
     * Three sensors, because one input model does not fit all three.
     *
     * Mouse drags on a small movement. Touch waits for a short hold — with a
     * distance trigger, every attempt to scroll the page by swiping a card
     * started a drag instead. Keyboard was absent entirely, which meant cards
     * announced themselves as draggable (dnd-kit sets role and description) and
     * then did nothing when a keyboard user pressed Space.
     */
    /**
     * Which column the dragged card is currently over.
     *
     * A ref because the keyboard coordinate getter is created once, when the
     * sensor is built, and needs the value as it is at keypress time rather than
     * as it was at construction.
     */
    const activeColumn = useRef<ColumnId | null>(null)

    /**
     * Arrow keys.
     *
     * Left and right jump to the neighbouring column; up and down fall through
     * to the sortable behaviour and reorder within the current one. Without this
     * the sortable getter treats every arrow as a reorder, so a keyboard user
     * could shuffle a card but never actually move it across the board — which
     * is the one thing a kanban is for.
     */
    const keyboardCoordinates = useCallback<KeyboardCoordinateGetter>((event, args) => {
        if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') {
            return sortableKeyboardCoordinates(event, args)
        }

        event.preventDefault()

        const { context } = args
        const rect = context.collisionRect
        const current = activeColumn.current
        if (!rect || !current) return undefined

        const step = event.code === 'ArrowRight' ? 1 : -1
        const target = COLUMNS[COLUMNS.findIndex(c => c.id === current) + step]
        if (!target) return undefined

        const targetRect = context.droppableRects.get(target.id)
        if (!targetRect) return undefined

        // Aim at the top of the target lane; dragOver settles the exact slot.
        return { x: targetRect.left + targetRect.width / 2, y: rect.top }
    }, [])

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates })
    )

    const activeCard = useMemo(
        () => cards.find(c => c.id === activeId) ?? null,
        [cards, activeId]
    )

    /** Which column something belongs to — whether it is a card or a column. */
    const columnOf = useCallback(
        (id: string): ColumnId | null => {
            if (isColumnId(id)) return id
            return cards.find(c => c.id === id)?.columnId ?? null
        },
        [cards]
    )

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const id = String(event.active.id)
            setActiveId(id)
            activeColumn.current = columnOf(id)
        },
        [columnOf]
    )

    /*
     * Cross-column moves happen here rather than on drop, so the card visibly
     * lands in the new column while it is still held. Doing it only at the end
     * makes the board feel like it is guessing.
     */
    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            const { active, over } = event
            if (!over) return

            const activeId = String(active.id)
            const overId = String(over.id)

            const from = columnOf(activeId)
            const to = columnOf(overId)
            if (!from || !to || from === to) return

            activeColumn.current = to

            setCards(prev => {
                const moving = prev.find(c => c.id === activeId)
                if (!moving) return prev

                const without = prev.filter(c => c.id !== activeId)
                const moved = { ...moving, columnId: to }

                // Dropped onto a card: land in that card's place. Dropped onto
                // the column itself (or its empty state): append.
                const index = without.findIndex(c => c.id === overId)
                if (index === -1) return [...without, moved]

                return [...without.slice(0, index), moved, ...without.slice(index)]
            })
        },
        [columnOf]
    )

    /** Reordering inside a column. Cross-column already settled in dragOver. */
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        activeColumn.current = null
        if (!over) return

        const activeId = String(active.id)
        const overId = String(over.id)
        if (activeId === overId) return

        setCards(prev => {
            const from = prev.findIndex(c => c.id === activeId)
            const to = prev.findIndex(c => c.id === overId)
            if (from === -1 || to === -1) return prev
            if (prev[from].columnId !== prev[to].columnId) return prev

            return arrayMove(prev, from, to)
        })
    }, [])

    const addCardToColumn = useCallback((columnId: ColumnId, title: string) => {
        setCards(prev => [...prev, { id: crypto.randomUUID(), title, columnId }])
    }, [])

    /*
     * Deleting offers a way back instead of asking first. A card is one line of
     * text — a confirm dialog for every removal is more friction than the action
     * deserves, while losing one with no recourse is worse than either.
     */
    const deleteCard = useCallback(
        (id: string) => {
            const card = cards.find(c => c.id === id)
            if (!card) return

            // Snapshot taken here, outside the updater. Raising the toast inside
            // one would fire it twice under StrictMode, which runs updaters
            // twice to surface exactly this kind of hidden side effect.
            const snapshot = cards

            setCards(prev => prev.filter(c => c.id !== id))

            toast.success(`${card.title} deleted.`, {
                duration: 8000,
                action: {
                    label: 'Undo',
                    // Restores the whole array, so the card returns to its exact
                    // position rather than the end of its column.
                    onClick: () => setCards(snapshot),
                },
            })
        },
        [cards]
    )

    return (
        <DndContext
            /*
             * A stable id. Without one dnd-kit derives its `aria-describedby`
             * targets from a module-level counter, which advances between the
             * server render and the client's, so every card hydrated pointing at
             * a different description than the server sent — a console error on
             * every load, and a screen-reader description wired to the wrong node.
             */
            id="kanban-board"
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
                setActiveId(null)
                activeColumn.current = null
            }}
        >
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
                {COLUMNS.map(column => (
                    <Column
                        key={column.id}
                        column={column}
                        cards={cards.filter(c => c.columnId === column.id)}
                        onDelete={deleteCard}
                        onAddCard={addCardToColumn}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeCard ? (
                    <CardShell card={activeCard} column={columnById(activeCard.columnId)} overlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
