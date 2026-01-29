'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, Trash2, Image as ImageIcon, MoreHorizontal } from 'lucide-react'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createBlock, updateBlock, deleteBlock } from '@/lib/actions/blocks'
import { BlockRenderer } from '../../block-renderer'
import { BlockWrapper } from '../../block-wrapper'
import { SlashMenu } from '../../slash-menu'
import { Block, BlockType, getDefaultBlockContent } from '../../types'
import { useRouter } from 'next/navigation'

// ========================================
// TYPES
// ========================================

interface DatabaseItem {
    id: string
    blockId: string
    title: string
    icon: string | null
    coverImage: string | null
    properties: Record<string, any>
    sortOrder: number
    childBlocks?: Block[] // Blocks that belong to this item
}

interface DatabaseProperty {
    id: string
    name: string
    type: string
    options?: { id: string; name: string; color: string }[]
}

interface ItemModalProps {
    isOpen: boolean
    onClose: () => void
    item: DatabaseItem | null
    properties: DatabaseProperty[]
    pageId: string
    onUpdate: (id: string, data: Partial<DatabaseItem>) => void
    onDelete: (id: string) => void
}

// ========================================
// ICON PICKER
// ========================================

const ICONS = ['📄', '📝', '📋', '✅', '🎯', '💡', '🔥', '⭐', '🚀', '💎', '📊', '📈', '🎨', '🔧', '📚', '🎭', '🎪', '🎬', '🎮', '🎯']

// ========================================
// IMPROVED ITEM MODAL COMPONENT
// ========================================

export function ItemModalImproved({
    isOpen,
    onClose,
    item,
    properties,
    pageId,
    onUpdate,
    onDelete,
}: ItemModalProps) {
    const router = useRouter()
    const [title, setTitle] = useState(item?.title || 'Untitled')
    const [icon, setIcon] = useState(item?.icon || '📄')
    const [showIconPicker, setShowIconPicker] = useState(false)
    const [blocks, setBlocks] = useState<Block[]>([])
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(false)
    const [showSlashMenu, setShowSlashMenu] = useState(false)
    const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)

    // Load blocks when item changes
    useEffect(() => {
        if (item) {
            setTitle(item.title)
            setIcon(item.icon || '📄')

            // Load blocks that belong to this database item
            // These are stored as childBlocks of the database item
            if (item.childBlocks && item.childBlocks.length > 0) {
                setBlocks(item.childBlocks)
            } else {
                setBlocks([])
            }
        }
    }, [item?.id])

    const handleTitleChange = useCallback((newTitle: string) => {
        setTitle(newTitle)
        if (item) {
            onUpdate(item.id, { title: newTitle })
        }
    }, [item, onUpdate])

    const handleIconChange = useCallback((newIcon: string) => {
        setIcon(newIcon)
        setShowIconPicker(false)
        if (item) {
            onUpdate(item.id, { icon: newIcon })
        }
    }, [item, onUpdate])

    const handlePropertyChange = useCallback((propertyId: string, value: any) => {
        if (item) {
            onUpdate(item.id, {
                properties: { ...item.properties, [propertyId]: value }
            })
        }
    }, [item, onUpdate])

    const handleDelete = useCallback(() => {
        if (item && confirm('Are you sure you want to delete this item?')) {
            onDelete(item.id)
        }
    }, [item, onDelete])

    // ========================================
    // BLOCK OPERATIONS WITH SERVER PERSISTENCE
    // ========================================

    const handleAddBlock = useCallback(async (type: BlockType, afterBlockId?: string) => {
        if (!item) return

        // Create optimistic block for immediate UI update
        const tempId = `temp-${Date.now()}`
        const optimisticBlock: Block = {
            id: tempId,
            pageId,
            type,
            content: getDefaultBlockContent(type),
            sortOrder: blocks.length,
            parentBlockId: item.id, // Link to database item
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Update UI immediately
        if (afterBlockId) {
            const index = blocks.findIndex(b => b.id === afterBlockId)
            const newBlocks = [...blocks]
            newBlocks.splice(index + 1, 0, optimisticBlock)
            setBlocks(newBlocks)
        } else {
            setBlocks([...blocks, optimisticBlock])
        }

        setFocusedBlockId(tempId)
        setShowSlashMenu(false)

        // Persist to server
        try {
            const result = await createBlock({
                pageId,
                type,
                content: getDefaultBlockContent(type),
                parentBlockId: item.id, // Important: link to database item
                sortOrder: afterBlockId
                    ? blocks.findIndex(b => b.id === afterBlockId) + 1
                    : blocks.length,
            })

            if (result.success && result.block) {
                // Replace temp block with real block
                setBlocks(prev => prev.map(b =>
                    b.id === tempId ? result.block as Block : b
                ))
                setFocusedBlockId(result.block.id)
                router.refresh()
            } else {
                // Rollback on error
                setBlocks(prev => prev.filter(b => b.id !== tempId))
                console.error('Failed to create block:', result.error)
            }
        } catch (error) {
            // Rollback on error
            setBlocks(prev => prev.filter(b => b.id !== tempId))
            console.error('Error creating block:', error)
        }
    }, [item, pageId, blocks, router])

    const handleUpdateBlock = useCallback(async (id: string, content: Record<string, unknown>) => {
        // Update UI immediately
        setBlocks(prev => prev.map(b =>
            b.id === id ? { ...b, content } : b
        ))

        // Debounced server update
        try {
            const result = await updateBlock(id, { content })
            if (!result.success) {
                console.error('Failed to update block:', result.error)
            }
        } catch (error) {
            console.error('Error updating block:', error)
        }
    }, [])

    const handleDeleteBlock = useCallback(async (id: string) => {
        if (!confirm('Delete this block?')) return

        // Update UI immediately
        const blockToDelete = blocks.find(b => b.id === id)
        setBlocks(prev => prev.filter(b => b.id !== id))

        // Persist to server
        try {
            const result = await deleteBlock(id)
            if (result.success) {
                router.refresh()
            } else {
                // Rollback on error
                if (blockToDelete) {
                    setBlocks(prev => [...prev, blockToDelete])
                }
                console.error('Failed to delete block:', result.error)
            }
        } catch (error) {
            // Rollback on error
            if (blockToDelete) {
                setBlocks(prev => [...prev, blockToDelete])
            }
            console.error('Error deleting block:', error)
        }
    }, [blocks, router])

    const handleOpenSlashMenu = useCallback((blockId: string | null, position?: { x: number; y: number }) => {
        setActiveBlockId(blockId)
        if (position) {
            setSlashMenuPosition(position)
        }
        setShowSlashMenu(true)
    }, [])

    if (!item) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                {/* Header with Cover */}
                <div className="relative">
                    {/* Cover Image Area */}
                    {item.coverImage ? (
                        <div className="h-48 bg-muted relative group">
                            <img
                                src={item.coverImage}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        const url = prompt('Enter image URL:', item.coverImage || '')
                                        if (url) onUpdate(item.id, { coverImage: url })
                                    }}
                                >
                                    Change cover
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onUpdate(item.id, { coverImage: null })}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 bg-gradient-to-r from-muted/50 to-muted flex items-center justify-center group">
                            <button
                                onClick={() => {
                                    const url = prompt('Enter image URL:')
                                    if (url) onUpdate(item.id, { coverImage: url })
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Add cover
                            </button>
                        </div>
                    )}

                    {/* Icon */}
                    <div className="absolute -bottom-8 left-8">
                        <div className="relative">
                            <button
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="text-5xl hover:bg-accent/50 rounded-lg p-2 transition-colors bg-background border border-border"
                            >
                                {icon}
                            </button>

                            {showIconPicker && (
                                <div className="absolute top-full left-0 mt-2 z-50 bg-popover border border-border rounded-lg shadow-xl p-3 grid grid-cols-6 gap-1">
                                    {ICONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleIconChange(emoji)}
                                            className="text-2xl p-2 hover:bg-accent rounded transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close & Actions */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-background/80 backdrop-blur"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 pt-12 pb-8">
                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Untitled"
                        className="w-full text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 mb-6 placeholder:text-muted-foreground/50"
                    />

                    {/* Properties */}
                    <div className="border-y border-border/50 py-4 mb-8 space-y-3">
                        {properties.map((prop) => (
                            <div key={prop.id} className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground w-32 flex-shrink-0 font-medium">
                                    {prop.name}
                                </span>
                                <div className="flex-1">
                                    {prop.type === 'SELECT' && (
                                        <StatusBadge
                                            value={item.properties[prop.id] || item.properties.status || 'not_started'}
                                            options={prop.options || []}
                                            onChange={(value) => handlePropertyChange(prop.id, value)}
                                        />
                                    )}
                                    {prop.type === 'TEXT' && (
                                        <input
                                            type="text"
                                            value={item.properties[prop.id] || ''}
                                            onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                                            placeholder="Empty"
                                            className="w-full bg-transparent border-none outline-none text-sm focus:ring-0"
                                        />
                                    )}
                                    {prop.type === 'DATE' && (
                                        <input
                                            type="date"
                                            value={item.properties[prop.id] || ''}
                                            onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm focus:ring-0"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Body - Block Editor */}
                    <div className="min-h-[300px]">
                        {isLoadingBlocks ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                            </div>
                        ) : blocks.length === 0 ? (
                            <div className="text-muted-foreground py-8">
                                <p className="text-sm mb-4">
                                    Start writing or type <kbd className="font-mono bg-muted px-2 py-1 rounded text-xs">/</kbd> for commands
                                </p>
                                <button
                                    onClick={() => handleAddBlock('TEXT')}
                                    className="text-sm text-primary hover:underline"
                                >
                                    + Add your first block
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {blocks.map((block) => (
                                    <BlockWrapper
                                        key={block.id}
                                        block={block}
                                        onDelete={() => handleDeleteBlock(block.id)}
                                        onDuplicate={() => { /* TODO: Implement */ }}
                                        onAddBlock={(type) => handleAddBlock(type, block.id)}
                                        onOpenSlashMenu={() => handleOpenSlashMenu(block.id)}
                                    >
                                        <BlockRenderer
                                            block={block}
                                            onUpdate={(content) => handleUpdateBlock(block.id, content)}
                                            onDelete={() => handleDeleteBlock(block.id)}
                                            onAddBlock={(type, afterId) => handleAddBlock(type, afterId)}
                                            onOpenSlashMenu={() => handleOpenSlashMenu(block.id)}
                                            focusedBlockId={focusedBlockId}
                                            isEditing={focusedBlockId === block.id}
                                        />
                                    </BlockWrapper>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add block button */}
                    {blocks.length > 0 && (
                        <button
                            onClick={() => handleAddBlock('TEXT')}
                            className="w-full mt-2 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors text-left px-3 flex items-center gap-2"
                        >
                            <span className="text-lg">+</span>
                            Add a block
                        </button>
                    )}
                </div>

                {/* Slash Menu */}
                {showSlashMenu && (
                    <SlashMenu
                        isOpen={showSlashMenu}
                        position={slashMenuPosition}
                        onSelect={(type) => {
                            handleAddBlock(type, activeBlockId || undefined)
                            setShowSlashMenu(false)
                        }}
                        onClose={() => setShowSlashMenu(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

// ========================================
// STATUS BADGE COMPONENT
// ========================================

function StatusBadge({
    value,
    options,
    onChange,
}: {
    value: string
    options: { id: string; name: string; color: string }[]
    onChange: (value: string) => void
}) {
    const current = options.find(o => o.id === value) || options[0]

    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    }

    if (!current) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80",
                    colorClasses[current.color] || colorClasses.gray
                )}>
                    {current.name}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            "flex items-center gap-2",
                            value === option.id && "bg-accent"
                        )}
                    >
                        <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            option.color === 'gray' && "bg-gray-500",
                            option.color === 'blue' && "bg-blue-500",
                            option.color === 'green' && "bg-green-500",
                            option.color === 'red' && "bg-red-500",
                            option.color === 'yellow' && "bg-yellow-500",
                            option.color === 'purple' && "bg-purple-500",
                        )} />
                        {option.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
