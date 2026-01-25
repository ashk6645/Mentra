import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Block, BlockType } from '../types'
import { BoardView } from '../views/board-view'
import { TableView } from '../views/table-view'
import { GalleryView } from '../views/gallery-view'
import { CalendarView } from '../views/calendar-view'
import { KanbanSquare, Table as TableIcon, LayoutGrid, CalendarDays, X, Maximize2, MoreHorizontal, ImageIcon, Clock, Hash, Tag, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { SHARED_DATABASE_ITEMS, DatabaseItem } from '../views/mock-data'
import { BlockEditor } from '../block-editor'

interface DatabaseBlockProps {
    block: Block
    isFocused: boolean
    onChange: (content: any) => void
}

export function DatabaseBlock({ block, isFocused, onChange }: DatabaseBlockProps) {
    const items: DatabaseItem[] = block.content.items || SHARED_DATABASE_ITEMS
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Lock body scroll when popup is open
    useEffect(() => {
        if (selectedItemId) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [selectedItemId])

    // Derived selected item
    const selectedItem = items.find(i => i.id === selectedItemId)

    // Handler to update an individual item
    const updateItem = (itemId: string, updates: Partial<DatabaseItem>) => {
        const newItems = items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        )
        onChange({ ...block.content, items: newItems })
    }

    // Handler to add a new item
    const addItem = (overrides?: Partial<DatabaseItem>) => {
        const newItem: DatabaseItem = {
            id: uuidv4(),
            title: '',
            status: 'Not started' as 'Not started',
            priority: 'Medium',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            blocks: [], // Empty blocks for new page
            ...overrides
        }
        const newItems = [...items, newItem]
        onChange({ ...block.content, items: newItems })
        // Optional: Auto-open the new item?
        // setSelectedItemId(newItem.id)
    }

    const deleteItem = (itemId: string) => {
        const newItems = items.filter(item => item.id !== itemId)
        onChange({ ...block.content, items: newItems })
        if (selectedItemId === itemId) setSelectedItemId(null)
    }

    // Handlers for nested BlockEditor inside the popup
    const handlePopupCreateBlock = (newBlock: Block, afterBlockId?: string) => {
        if (!selectedItem) return
        // Use a simple local helper to simulate block creation in the item's block list
        // In a real app, this would use the same actions as the main editor, 
        // but scoped to this item's data.
        // For now, we'll just update the item's 'blocks' array directly.
        const currentBlocks = selectedItem.blocks || []
        let newBlocks = [...currentBlocks]

        if (afterBlockId) {
            const index = newBlocks.findIndex(b => b.id === afterBlockId)
            if (index !== -1) {
                newBlocks.splice(index + 1, 0, newBlock)
            } else {
                newBlocks.push(newBlock)
            }
        } else {
            newBlocks.push(newBlock)
        }
        updateItem(selectedItem.id, { blocks: newBlocks })
    }

    const handlePopupUpdateBlock = (blockId: string, updates: any) => {
        if (!selectedItem) return
        const currentBlocks = selectedItem.blocks || []
        const newBlocks = currentBlocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
        updateItem(selectedItem.id, { blocks: newBlocks })
    }

    const handlePopupDeleteBlock = (blockId: string) => {
        if (!selectedItem) return
        const currentBlocks = selectedItem.blocks || []
        const newBlocks = currentBlocks.filter(b => b.id !== blockId)
        updateItem(selectedItem.id, { blocks: newBlocks })
    }

    const handlePopupReorderBlocks = (newBlocks: Block[]) => {
        if (!selectedItem) return
        updateItem(selectedItem.id, { blocks: newBlocks })
    }


    const getViewType = (type: BlockType) => {
        if (type === 'DATABASE_BOARD') return 'board'
        if (type === 'DATABASE_GALLERY') return 'gallery'
        if (type === 'DATABASE_CALENDAR') return 'calendar'
        return 'table'
    }

    const activeView = getViewType(block.type)
    const effectiveView = (block.content.view as string) || activeView

    const handleViewChange = (view: 'table' | 'board' | 'gallery' | 'calendar') => {
        onChange({ ...block.content, view })
    }

    return (
        <div className="flex flex-col space-y-4 my-6 w-full group/db select-none">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-0.5 mb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-t-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                        {effectiveView === 'table' && <TableIcon className="w-5 h-5" />}
                        {effectiveView === 'board' && <KanbanSquare className="w-5 h-5" />}
                        {effectiveView === 'gallery' && <LayoutGrid className="w-5 h-5" />}
                        {effectiveView === 'calendar' && <CalendarDays className="w-5 h-5" />}
                        <input
                            type="text"
                            value={block.content.title || ''}
                            onChange={(e) => onChange({ ...block.content, title: e.target.value })}
                            placeholder="Database"
                            className="bg-transparent border-none outline-none font-semibold text-xl placeholder:text-gray-400 focus:ring-0 p-0 m-0 min-w-[120px]"
                        />
                    </div>
                    {/* Add View Button (Visual only) */}
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1 text-gray-500">
                    {/* View Switchers */}
                    <div className="flex bg-gray-50 dark:bg-zinc-900 rounded-md p-0.5 border border-gray-200 dark:border-zinc-800">
                        <button
                            onClick={() => handleViewChange('table')}
                            className={cn("p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-800 transition-all", effectiveView === 'table' && "bg-white dark:bg-zinc-700 text-foreground shadow-sm")}
                            title="Table View"
                        >
                            <TableIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleViewChange('board')}
                            className={cn("p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-800 transition-all", effectiveView === 'board' && "bg-white dark:bg-zinc-700 text-foreground shadow-sm")}
                            title="Board View"
                        >
                            <KanbanSquare className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleViewChange('gallery')}
                            className={cn("p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-800 transition-all", effectiveView === 'gallery' && "bg-white dark:bg-zinc-700 text-foreground shadow-sm")}
                            title="Gallery View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Content */}
            <div className="min-h-[200px] overflow-hidden">
                {effectiveView === 'board' && (
                    <BoardView
                        items={items}
                        onUpdateItem={updateItem}
                        onAddItem={(colId) => addItem({ status: colId })}
                        onDeleteItem={deleteItem}
                        onOpenItem={setSelectedItemId}
                    />
                )}
                {effectiveView === 'table' && (
                    <TableView
                        items={items}
                        onUpdateItem={updateItem}
                        onAddItem={() => addItem()}
                        onDeleteItem={deleteItem}
                        onOpenItem={setSelectedItemId}
                    />
                )}
                {effectiveView === 'gallery' && (
                    <GalleryView
                        items={items}
                        onUpdateItem={updateItem}
                        onAddItem={() => addItem()}
                        onDeleteItem={deleteItem}
                        onOpenItem={setSelectedItemId}
                    />
                )}
                {effectiveView === 'calendar' && (
                    <CalendarView
                        items={items}
                        onUpdateItem={updateItem}
                        onAddItem={() => addItem()}
                        onDeleteItem={deleteItem}
                    />
                )}
            </div>

            {/* PAGE POPUP OVERLAY (PORTAL) */}
            {mounted && selectedItemId && selectedItem && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-12 animate-in fade-in duration-200" onClick={() => setSelectedItemId(null)}>
                    <div
                        className="bg-background w-full max-w-4xl h-full max-h-[90vh] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Popup Header Actions */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
                            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Maximize2 className="w-4 h-4" />
                                <span>Open as page</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 hover:bg-accent rounded text-muted-foreground">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSelectedItemId(null)}
                                    className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Popup Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Cover Image */}
                            <div className="group relative w-full h-48 bg-muted">
                                {selectedItem.cover ? (
                                    <img src={selectedItem.cover} className="w-full h-full object-cover" alt="Cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                        <ImageIcon className="w-12 h12" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-xs bg-background/80 hover:bg-background border border-border px-2 py-1 rounded shadow-sm backdrop-blur">
                                        Change cover
                                    </button>
                                </div>
                            </div>

                            {/* Page Content Container */}
                            <div className="max-w-3xl mx-auto w-full px-8 pb-16">
                                {/* Icon & Title */}
                                <div className="-mt-10 mb-8 relative">
                                    <div className="text-6xl mb-4 select-none cursor-pointer hover:opacity-80 transition-opacity w-fit">
                                        {/* Fallback Icon */}
                                        {selectedItem.icon || '📄'}
                                    </div>
                                    <input
                                        className="text-4xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/40"
                                        placeholder="Untitled"
                                        value={selectedItem.title}
                                        onChange={(e) => updateItem(selectedItem.id, { title: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                {/* Properties */}
                                <div className="space-y-1 mb-8">
                                    {/* Status */}
                                    <div className="flex items-center py-1">
                                        <div className="w-32 flex items-center gap-2 text-muted-foreground text-sm">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Status</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-sm bg-accent/50 text-foreground w-fit block",
                                                selectedItem.status === 'Done' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                                                selectedItem.status === 'In progress' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                            )}>
                                                {selectedItem.status}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Priority */}
                                    <div className="flex items-center py-1">
                                        <div className="w-32 flex items-center gap-2 text-muted-foreground text-sm">
                                            <Tag className="w-4 h-4" />
                                            <span>Priority</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm px-2 py-0.5 rounded bg-accent/50 text-foreground w-fit block">
                                                {selectedItem.priority}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Date */}
                                    <div className="flex items-center py-1">
                                        <div className="w-32 flex items-center gap-2 text-muted-foreground text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>Date</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm text-foreground/80 hover:bg-accent px-1.5 -ml-1.5 py-0.5 rounded cursor-pointer transition-colors block w-fit">
                                                {selectedItem.date || 'Empty'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-border my-6" />

                                {/* Nested Block Editor */}
                                <div className="min-h-[200px]">
                                    <BlockEditor
                                        initialBlocks={selectedItem.blocks || []}
                                        onCreateBlock={handlePopupCreateBlock}
                                        onUpdateBlock={handlePopupUpdateBlock}
                                        onDeleteBlock={handlePopupDeleteBlock}
                                        onReorderBlocks={handlePopupReorderBlocks}
                                        isNested
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
