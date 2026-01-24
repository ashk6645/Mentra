import React, { useState } from 'react'
import { Block } from '../types'
import { BoardView } from '../views/board-view'
import { TableView } from '../views/table-view'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs' // Assuming we have these or need to make them
import { KanbanSquare, Table as TableIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatabaseBlockProps {
    block: Block
    isFocused: boolean
    updateBlock: (id: string, content: any) => void
}

export function DatabaseBlock({ block, isFocused, updateBlock }: DatabaseBlockProps) {
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
        // Let's implement view switching via `content.viewType` override for now, 
        // OR fix BlockRenderer to allow full updates.

        // Actually, let's stick to using `block.type` as the source of truth, 
        // but since we can't update it easily from here, 
        // let's use `content.view` as a preferred override if present.

        updateBlock(block.id, { view })
    }

    // Determine effective view
    const effectiveView = (block.content.view as string) || activeView

    return (
        <div className="flex flex-col space-y-4 my-4 w-full border rounded-md p-4 bg-gray-50/50 dark:bg-zinc-900/50 group/db">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    {effectiveView === 'table' && <Table className="w-4 h-4" />}
                    {effectiveView === 'board' && <KanbanSquare className="w-4 h-4" />}
                    {effectiveView === 'gallery' && <LayoutGrid className="w-4 h-4" />}
                    {effectiveView === 'calendar' && <CalendarDays className="w-4 h-4" />}
                    <span>{block.content.title || 'Database'}</span>
                </div>

                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 gap-1 opacity-0 group-hover/db:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleViewChange('table')}
                        className={cn("p-1 rounded hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all", effectiveView === 'table' && "bg-white dark:bg-zinc-700 text-blue-500")}
                        title="Table View"
                    >
                        <Table className="w-4 h-4" />
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
                {effectiveView === 'board' && <BoardView block={block} />}
                {effectiveView === 'table' && <TableView block={block} />}
                {effectiveView === 'gallery' && <GalleryView block={block} />}
                {effectiveView === 'calendar' && <CalendarView block={block} />}
            </div>
        </div>
    )
}
