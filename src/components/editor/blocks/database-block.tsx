import React, { useState } from 'react'
import { Block, BlockType } from '../types'
import { BoardView } from '../views/board-view'
import { TableView } from '../views/table-view'
import { GalleryView } from '../views/gallery-view'
import { CalendarView } from '../views/calendar-view'
import { KanbanSquare, Table as TableIcon, LayoutGrid, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatabaseBlockProps {
    block: Block
    isFocused: boolean
    onChange: (content: any) => void
}

import { SHARED_DATABASE_ITEMS, DatabaseItem } from '../views/mock-data'
import { v4 as uuidv4 } from 'uuid'

export function DatabaseBlock({ block, isFocused, onChange }: DatabaseBlockProps) {
    // Initialize items from content or seed with mock data
    // We use a local state to ensure immediate UI feedback, 
    // but we MUST sync to block.content via onChange.

    // If block.content.items is missing, we should probably initialize it.
    // However, we want to do this only once.
    // BUT, since we are in a render function, we can't side-effect easily.
    // We'll derive the items to display.

    const items: DatabaseItem[] = block.content.items || SHARED_DATABASE_ITEMS

    // Handler to update an individual item
    const updateItem = (itemId: string, updates: Partial<DatabaseItem>) => {
        const newItems = items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        )
        // Persist to block content
        onChange({ ...block.content, items: newItems })
    }

    // Handler to add a new item
    const addItem = () => {
        const newItem: DatabaseItem = {
            id: uuidv4(),
            title: '',
            status: 'Not started',
            priority: 'Medium',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
        const newItems = [...items, newItem]
        onChange({ ...block.content, items: newItems })
    }

    // Handler to delete an item (optional, but good for completeness)
    const deleteItem = (itemId: string) => {
        const newItems = items.filter(item => item.id !== itemId)
        onChange({ ...block.content, items: newItems })
    }
    // Determine active view from block type if not overridden by local state
    // Actually, distinct block types mean distinct blocks. 
    // But we might want to switch view TYPE within the same block, 
    // OR just use local state for "view mode" while the block type remains semantic?
    // Notion changes the block type or view type when you switch views.
    // Let's rely on block.type.

    // Map internal view to block type for switching
    const getViewType = (type: BlockType) => {
        if (type === 'DATABASE_BOARD') return 'board'
        if (type === 'DATABASE_GALLERY') return 'gallery'
        if (type === 'DATABASE_CALENDAR') return 'calendar'
        return 'table'
    }

    const activeView = getViewType(block.type)

    const handleViewChange = (view: 'table' | 'board' | 'gallery' | 'calendar') => {
        // We update the block TYPE itself to persist the view choice
        let newType: BlockType = 'DATABASE_TABLE'
        if (view === 'board') newType = 'DATABASE_BOARD'
        if (view === 'gallery') newType = 'DATABASE_GALLERY'
        if (view === 'calendar') newType = 'DATABASE_CALENDAR'

        // This relies on the Editor handling type updates (which we fixed!)
        // However, we need to call a prop that supports type update not just content.
        // The updateBlock prop from BlockRenderer calls updateBlock(id, {content}).
        // It does NOT support type change directly usually unless we pass it up.
        // BUT, we can use the `onUpdateBlock` we added to BlockEditor which calls `updateBlock`
        // which calls `useBlockEditor`'s `updateBlock`. 
        // `useBlockEditor`'s `updateBlock` takes Partial<Block>, so it CAN update type!
        // We just need to check if the `updateBlock` passed here supports Partial<Block>.
        // Looking at BlockRenderer, it passes `onUpdate`.
        // `BlockRenderer` definition: `onUpdate: (content: BlockContent) => void`.
        // So we are limited to Content updates only here :(

        // Hack: We can use a special content field `viewType` if we can't change block type.
        // OR we just ask the parent to change type.
        // But `updateBlock` here is typed as `(id, content)`.

        // Let's look at `BlockRenderer` implementation again.
        // It calls `updateBlock(block.id, { content: ... })`.
        // Wait, `onUpdate` in `BlockRenderer` props is `(content: any) => void`.

        // So we can't change type easily from here without refactoring `BlockRenderer` or `DatabaseBlock`.
        // User wants "smooth".
        // Since we can't easily change the block TYPE from here (BlockRenderer constraint),
        // we update the content.view property.
        // The onChange prop from BlockRenderer handles calling updateBlock for us.

        onChange({ ...block.content, view })
    }

    // Determine effective view
    const effectiveView = (block.content.view as string) || activeView

    return (
        <div className="flex flex-col space-y-4 my-4 w-full group/db">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    {effectiveView === 'table' && <TableIcon className="w-4 h-4" />}
                    {effectiveView === 'board' && <KanbanSquare className="w-4 h-4" />}
                    {effectiveView === 'gallery' && <LayoutGrid className="w-4 h-4" />}
                    {effectiveView === 'calendar' && <CalendarDays className="w-4 h-4" />}
                    <input
                        type="text"
                        value={block.content.title || ''}
                        onChange={(e) => onChange({ ...block.content, title: e.target.value })}
                        placeholder="Database"
                        className="bg-transparent border-none outline-none font-medium placeholder:text-gray-400 focus:ring-0 p-0 m-0 w-full"
                    />
                </div>

                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 gap-1 opacity-0 group-hover/db:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleViewChange('table')}
                        className={cn("p-1 rounded hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all", effectiveView === 'table' && "bg-white dark:bg-zinc-700 text-blue-500")}
                        title="Table View"
                    >
                        <TableIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleViewChange('board')}
                        className={cn("p-1 rounded hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all", effectiveView === 'board' && "bg-white dark:bg-zinc-700 text-blue-500")}
                        title="Board View"
                    >
                        <KanbanSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleViewChange('gallery')}
                        className={cn("p-1 rounded hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all", effectiveView === 'gallery' && "bg-white dark:bg-zinc-700 text-blue-500")}
                        title="Gallery View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleViewChange('calendar')}
                        className={cn("p-1 rounded hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all", effectiveView === 'calendar' && "bg-white dark:bg-zinc-700 text-blue-500")}
                        title="Calendar View"
                    >
                        <CalendarDays className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="min-h-[200px] overflow-x-auto">
                <div className="min-h-[200px] overflow-x-auto">
                    {effectiveView === 'board' && (
                        <BoardView
                            items={items}
                            onUpdateItem={updateItem}
                            onAddItem={addItem}
                            onDeleteItem={deleteItem}
                        />
                    )}
                    {effectiveView === 'table' && (
                        <TableView
                            items={items}
                            onUpdateItem={updateItem}
                            onAddItem={addItem}
                            onDeleteItem={deleteItem}
                        />
                    )}
                    {effectiveView === 'gallery' && (
                        <GalleryView
                            items={items}
                            onUpdateItem={updateItem}
                            onAddItem={addItem}
                            onDeleteItem={deleteItem}
                        />
                    )}
                    {effectiveView === 'calendar' && (
                        <CalendarView
                            items={items}
                            onUpdateItem={updateItem}
                            onAddItem={addItem}
                            onDeleteItem={deleteItem}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
