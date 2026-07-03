'use client'

import { useState, useCallback } from 'react'
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
import { X } from 'lucide-react'
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
        dotColor: 'bg-amber-400',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-l-amber-400',
    },
    {
        id: 'inprogress' as ColumnId,
        label: 'IN PROGRESS',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-l-blue-500',
    },
    {
        id: 'done' as ColumnId,
        label: 'DONE',
        dotColor: 'bg-green-500',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-l-green-500',
    },
]

const INITIAL_CARDS: KanbanCard[] = [
    { id: 'c1', title: 'Sketch the video outline', columnId: 'todo' },
    { id: 'c2', title: 'Record voiceover', columnId: 'todo' },
    { id: 'c3', title: 'Edit rough cut', columnId: 'inprogress' },
    { id: 'c4', title: 'Publish thumbnail', columnId: 'done' },
]

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

function DroppableColumn({
    column,
    cards,
    onDelete,
}: {
    column: (typeof COLUMNS)[0]
    cards: KanbanCard[]
    onDelete: (id: string) => void
}) {
    const { isOver, setNodeRef } = useDroppable({ id: column.id })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex flex-col rounded-2xl border p-4 min-h-[420px] transition-colors duration-200',
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

            {/* Cards */}
            <div className="space-y-2 flex-1">
                {cards.map(card => (
                    <DraggableCard key={card.id} card={card} onDelete={onDelete} />
                ))}
            </div>
        </div>
    )
}

export function KanbanBoard() {
    const [cards, setCards] = useState<KanbanCard[]>(INITIAL_CARDS)
    const [newCardTitle, setNewCardTitle] = useState('')
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

    const addCard = useCallback(() => {
        const title = newCardTitle.trim()
        if (!title) return
        setCards(prev => [
            ...prev,
            { id: `card-${Date.now()}`, title, columnId: 'todo' },
        ])
        setNewCardTitle('')
    }, [newCardTitle])

    const deleteCard = useCallback((id: string) => {
        setCards(prev => prev.filter(c => c.id !== id))
    }, [])

    return (
        <div className="flex flex-col gap-6">
            {/* Add Card Row */}
            <div className="flex gap-3">
                <input
                    type="text"
                    value={newCardTitle}
                    onChange={e => setNewCardTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCard()}
                    placeholder="New card title"
                    className={cn(
                        'flex-1 h-10 px-4 rounded-xl border border-gray-200 dark:border-zinc-700',
                        'bg-white dark:bg-zinc-900 text-sm text-gray-700 dark:text-zinc-200',
                        'placeholder:text-gray-400 dark:placeholder:text-zinc-500',
                        'focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-zinc-700 focus:border-gray-300',
                        'transition shadow-sm'
                    )}
                />
                <button
                    onClick={addCard}
                    className="h-10 px-5 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-zinc-200 transition shrink-0 shadow-sm"
                >
                    Add card
                </button>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {COLUMNS.map(col => (
                        <DroppableColumn
                            key={col.id}
                            column={col}
                            cards={cards.filter(c => c.columnId === col.id)}
                            onDelete={deleteCard}
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
