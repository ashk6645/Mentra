'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type ColumnId = 'todo' | 'inprogress' | 'done'

interface KanbanCard {
    id: string
    title: string
    columnId: ColumnId
}

const COLUMNS = [
    {
        id: 'todo' as ColumnId,
        label: 'TO DO',
        addLabel: 'Add To Do',
        dotColor: 'bg-amber-400',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-l-amber-400',
        addBtnColor: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
        inputRing: 'focus:ring-amber-200 dark:focus:ring-amber-800/40 border-amber-200 dark:border-amber-800/40',
        confirmBtnColor: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    {
        id: 'inprogress' as ColumnId,
        label: 'IN PROGRESS',
        addLabel: 'Add In Progress',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-l-blue-500',
        addBtnColor: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        inputRing: 'focus:ring-blue-200 dark:focus:ring-blue-800/40 border-blue-200 dark:border-blue-800/40',
        confirmBtnColor: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    {
        id: 'done' as ColumnId,
        label: 'DONE',
        addLabel: 'Add Done',
        dotColor: 'bg-green-500',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-l-green-500',
        addBtnColor: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
        inputRing: 'focus:ring-green-200 dark:focus:ring-green-800/40 border-green-200 dark:border-green-800/40',
        confirmBtnColor: 'bg-green-500 hover:bg-green-600 text-white',
    },
]

const INITIAL_CARDS: KanbanCard[] = [
    { id: 'c1', title: 'Sketch the video outline', columnId: 'todo' },
    { id: 'c2', title: 'Record voiceover', columnId: 'todo' },
    { id: 'c3', title: 'Edit rough cut', columnId: 'inprogress' },
    { id: 'c4', title: 'Publish thumbnail', columnId: 'done' },
]

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({
    card,
    onDelete,
    isDragOverlay = false,
}: {
    card: KanbanCard
    onDelete: (id: string) => void
    isDragOverlay?: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: card.id,
    })

    const col = COLUMNS.find(c => c.id === card.columnId)!

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm',
                'p-3.5 flex items-center gap-2 transition-all select-none',
                'border-l-4',
                col.borderColor,
                isDragging && !isDragOverlay && 'opacity-30 scale-95',
                isDragOverlay && 'shadow-2xl rotate-1 scale-105 ring-2 ring-black/10',
                !isDragOverlay && 'cursor-grab active:cursor-grabbing hover:shadow-md'
            )}
            {...attributes}
            {...listeners}
        >
            <span
                className={cn(
                    'flex-1 text-sm font-medium leading-snug text-gray-700 dark:text-zinc-200',
                    card.columnId === 'done' && 'line-through text-gray-400 dark:text-zinc-500'
                )}
            >
                {card.title}
            </span>
            {!isDragOverlay && (
                <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => {
                        e.stopPropagation()
                        onDelete(card.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 shrink-0"
                    aria-label="Delete card"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}

// ─── Inline Add Input ─────────────────────────────────────────────────────────

function InlineAddInput({
    column,
    onAdd,
    onCancel,
}: {
    column: (typeof COLUMNS)[0]
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
                placeholder="Card title…"
                className={cn(
                    'w-full h-9 px-3 rounded-lg border text-sm',
                    'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200',
                    'placeholder:text-gray-400 dark:placeholder:text-zinc-500',
                    'focus:outline-none focus:ring-2 transition shadow-sm',
                    column.inputRing
                )}
            />
            <div className="flex gap-2">
                <button
                    onClick={submit}
                    className={cn(
                        'flex-1 h-8 rounded-lg text-xs font-semibold transition',
                        column.confirmBtnColor
                    )}
                >
                    Add card
                </button>
                <button
                    onClick={onCancel}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition shrink-0"
                    aria-label="Cancel"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({
    column,
    cards,
    onDelete,
    onAddCard,
}: {
    column: (typeof COLUMNS)[0]
    cards: KanbanCard[]
    onDelete: (id: string) => void
    onAddCard: (columnId: ColumnId, title: string) => void
}) {
    const { isOver, setNodeRef } = useDroppable({ id: column.id })
    const [isAdding, setIsAdding] = useState(false)

    const handleAdd = (title: string) => {
        onAddCard(column.id, title)
        setIsAdding(false)
    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex flex-col rounded-2xl border p-4 transition-colors duration-200 h-fit',
                'bg-gray-50 dark:bg-zinc-900/60 border-gray-100 dark:border-zinc-800',
                isOver && 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40'
            )}
        >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-4">
                <div className={cn('w-2 h-2 rounded-full shrink-0', column.dotColor)} />
                <span className={cn('text-[11px] font-bold tracking-widest uppercase', column.textColor)}>
                    {column.label}
                </span>
                <span className="ml-auto text-xs font-semibold text-gray-400 dark:text-zinc-500 bg-gray-200/70 dark:bg-zinc-800 rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {cards.length}
                </span>
            </div>

            {/* Cards — capped at 8 visible cards, scrollable beyond that */}
            <div className="space-y-2 overflow-y-auto max-h-[464px] no-scrollbar">
                {cards.map(card => (
                    <DraggableCard key={card.id} card={card} onDelete={onDelete} />
                ))}
            </div>

            {/* Inline Add */}
            {isAdding ? (
                <InlineAddInput
                    column={column}
                    onAdd={handleAdd}
                    onCancel={() => setIsAdding(false)}
                />
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className={cn(
                        'mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl',
                        'text-xs font-semibold transition-colors',
                        column.addBtnColor
                    )}
                >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    {column.addLabel}
                </button>
            )}
        </div>
    )
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function KanbanBoard() {
    const [cards, setCards] = useState<KanbanCard[]>(INITIAL_CARDS)
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    )

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const card = cards.find(c => c.id === event.active.id)
            setActiveCard(card ?? null)
        },
        [cards]
    )

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        setActiveCard(null)

        if (!over) return

        const targetColumnId = over.id as ColumnId
        if (!COLUMNS.find(c => c.id === targetColumnId)) return

        setCards(prev =>
            prev.map(card =>
                card.id === active.id ? { ...card, columnId: targetColumnId } : card
            )
        )
    }, [])

    // Add card directly to a specific column
    const addCardToColumn = useCallback((columnId: ColumnId, title: string) => {
        setCards(prev => [
            ...prev,
            { id: `card-${Date.now()}`, title, columnId },
        ])
    }, [])

    const deleteCard = useCallback((id: string) => {
        setCards(prev => prev.filter(c => c.id !== id))
    }, [])

    return (
        <div className="flex flex-col gap-6">
            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    {COLUMNS.map(col => (
                        <DroppableColumn
                            key={col.id}
                            column={col}
                            cards={cards.filter(c => c.columnId === col.id)}
                            onDelete={deleteCard}
                            onAddCard={addCardToColumn}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeCard ? (
                        <DraggableCard card={activeCard} onDelete={deleteCard} isDragOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
