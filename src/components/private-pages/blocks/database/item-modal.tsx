'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, Trash2, Image as ImageIcon, MoreHorizontal } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { getBlocksForPage, createBlock, updateBlock, deleteBlock, insertBlockAt } from '@/lib/actions/blocks'
import { BlockRenderer } from '../../block-renderer'
import { BlockWrapper } from '../../block-wrapper'
import { SlashMenu } from '../../slash-menu'
import { Block, BlockType } from '../../types'

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

const ICONS = ['📄', '📝', '📋', '✅', '🎯', '💡', '🔥', '⭐', '🚀', '💎', '📊', '📈', '🎨', '🔧', '📚']

// ========================================
// ITEM MODAL COMPONENT
// ========================================

export function ItemModal({
    isOpen,
    onClose,
    item,
    properties,
    pageId,
    onUpdate,
    onDelete,
}: ItemModalProps) {
    const [title, setTitle] = useState(item?.title || 'Untitled')
    const [icon, setIcon] = useState(item?.icon || '📄')
    const [showIconPicker, setShowIconPicker] = useState(false)
    const [blocks, setBlocks] = useState<Block[]>([])
    const [showSlashMenu, setShowSlashMenu] = useState(false)
    const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

    // Reset state when item changes
    useEffect(() => {
        if (item) {
            setTitle(item.title)
            setIcon(item.icon || '📄')
            // Here we would load blocks that belong to this item
            // For now, we'll leave it empty and allow adding blocks
            setBlocks([])
        }
    }, [item?.id])

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle)
        if (item) {
            onUpdate(item.id, { title: newTitle })
        }
    }

    const handleIconChange = (newIcon: string) => {
        setIcon(newIcon)
        setShowIconPicker(false)
        if (item) {
            onUpdate(item.id, { icon: newIcon })
        }
    }

    const handlePropertyChange = (propertyId: string, value: any) => {
        if (item) {
            onUpdate(item.id, {
                properties: { ...item.properties, [propertyId]: value }
            })
        }
    }

    const handleDelete = () => {
        if (item) {
            onDelete(item.id)
        }
    }

    // Block operations (local state for now - would connect to server for persistence)
    const handleAddBlock = (type: BlockType, afterBlockId?: string) => {
        const newBlock: Block = {
            id: `temp-${Date.now()}`,
            pageId,
            type,
            content: {},
            sortOrder: blocks.length,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        if (afterBlockId) {
            const index = blocks.findIndex(b => b.id === afterBlockId)
            const newBlocks = [...blocks]
            newBlocks.splice(index + 1, 0, newBlock)
            setBlocks(newBlocks)
        } else {
            setBlocks([...blocks, newBlock])
        }

        setShowSlashMenu(false)
    }

    const handleUpdateBlock = (id: string, content: Record<string, unknown>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b))
    }

    const handleDeleteBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id))
    }

    const handleSlashCommand = (blockId: string, position: { x: number; y: number }) => {
        setActiveBlockId(blockId)
        setSlashMenuPosition(position)
        setShowSlashMenu(true)
    }

    if (!item) return null

    const statusProperty = properties.find(p => p.type === 'SELECT')

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
                {/* Header with Cover */}
                <div className="relative">
                    {/* Cover Image Area */}
                    <div className="h-32 bg-gradient-to-r from-muted/50 to-muted flex items-center justify-center group">
                        <button className="text-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Add cover
                        </button>
                    </div>

                    {/* Icon */}
                    <div className="absolute -bottom-8 left-6">
                        <div className="relative">
                            <button
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="text-5xl hover:bg-accent/50 rounded-lg p-1 transition-colors"
                            >
                                {icon}
                            </button>

                            {showIconPicker && (
                                <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1">
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80">
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
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pt-12 pb-6">
                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Untitled"
                        className="w-full text-3xl font-bold bg-transparent border-none outline-none focus:ring-0 mb-4 placeholder:text-muted-foreground/50"
                    />

                    {/* Properties */}
                    <div className="border-y border-border/50 py-3 mb-6 space-y-2">
                        {properties.map((prop) => (
                            <div key={prop.id} className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground w-24 flex-shrink-0">{prop.name}</span>
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
                                        className="flex-1 bg-transparent border-none outline-none text-sm"
                                    />
                                )}
                            </div>
                        ))}
                        <button className="text-sm text-muted-foreground hover:text-foreground">
                            + Add a property
                        </button>
                    </div>

                    {/* Body - Block Editor */}
                    <div className="min-h-[200px]">
                        {blocks.length === 0 ? (
                            <div className="text-muted-foreground">
                                <p className="text-sm mb-2">
                                    Type <span className="font-mono bg-muted px-1 rounded">/</span> for commands, or just start typing...
                                </p>
                                <button
                                    onClick={() => handleAddBlock('TEXT')}
                                    className="text-sm hover:text-foreground"
                                >
                                    Click here to add content
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {blocks.map((block) => (
                                    <BlockWrapper
                                        key={block.id}
                                        block={block}
                                        onDelete={() => handleDeleteBlock(block.id)}
                                        onDuplicate={() => { }}
                                        onAddAbove={() => handleAddBlock('TEXT', block.id)}
                                    >
                                        <BlockRenderer
                                            block={block}
                                            onUpdate={(content) => handleUpdateBlock(block.id, content)}
                                            onDelete={() => handleDeleteBlock(block.id)}
                                            onAddBlock={(type, afterId) => handleAddBlock(type, afterId)}
                                        />
                                    </BlockWrapper>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add block button */}
                    <button
                        onClick={() => handleAddBlock('TEXT')}
                        className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors text-left px-2"
                    >
                        + Add a block
                    </button>
                </div>

                {/* Slash Menu */}
                {showSlashMenu && (
                    <SlashMenu
                        position={slashMenuPosition}
                        onSelect={(type) => handleAddBlock(type, activeBlockId || undefined)}
                        onClose={() => setShowSlashMenu(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

// ========================================
// STATUS BADGE (Reused from DatabaseBlock)
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
    }

    if (!current) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    colorClasses[current.color] || colorClasses.gray
                )}>
                    {current.name}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(value === option.id && "bg-accent")}
                    >
                        <span className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            option.color === 'gray' && "bg-gray-500",
                            option.color === 'blue' && "bg-blue-500",
                            option.color === 'green' && "bg-green-500",
                        )} />
                        {option.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
