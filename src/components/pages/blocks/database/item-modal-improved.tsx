'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, Trash2, Image as ImageIcon, MoreHorizontal } from 'lucide-react'
import { IconPicker } from '../../icon-picker'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { BlockEditor } from '@/components/editor/block-editor'
import { Block, BlockType } from '@/components/editor/types'
import { useRouter } from 'next/navigation'

// ========================================
// TYPES
// ========================================

interface DatabaseItem {
    id: string
    blockId?: string
    title: string
    icon: string | null
    cover?: string // Changed from coverImage to cover to match mock data
    status: 'Not started' | 'In progress' | 'Done'
    priority?: 'High' | 'Medium' | 'Low'
    date?: string
    properties?: Record<string, any> // Keep for extra properties
    sortOrder?: number
    blocks?: Block[] // Changed from childBlocks to blocks
    childBlocks?: Block[]
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

    // Load blocks when item changes
    useEffect(() => {
        if (item) {
            setTitle(item.title)
            setIcon(item.icon || '📄')

            // Load blocks that belong to this database item
            if (item.blocks && item.blocks.length > 0) {
                setBlocks(item.blocks)
            } else if (item.childBlocks && item.childBlocks.length > 0) {
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
            // Check if it's a top-level property
            if (['status', 'priority', 'date'].includes(propertyId)) {
                onUpdate(item.id, { [propertyId]: value })
            } else {
                onUpdate(item.id, {
                    properties: { ...item.properties, [propertyId]: value }
                })
            }
        }
    }, [item, onUpdate])

    const handleDelete = useCallback(() => {
        if (item && confirm('Are you sure you want to delete this item?')) {
            onDelete(item.id)
        }
    }, [item, onDelete])

    // ========================================
    // BLOCK EDITOR INTEGRATION
    // ========================================

    const handleBlocksChange = useCallback((newBlocks: Block[]) => {
        setBlocks(newBlocks)
        if (item) {
            onUpdate(item.id, { blocks: newBlocks })
        }
    }, [item, onUpdate])

    if (!item) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                <DialogTitle className="sr-only">Edit Item</DialogTitle>
                {/* Header with Cover */}
                <div className="relative">
                    {/* Cover Image Area */}
                    {item.cover ? (
                        <div className="h-48 bg-muted relative group">
                            <img
                                src={item.cover}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        const url = prompt('Enter image URL:', item.cover || '')
                                        if (url) onUpdate(item.id, { cover: url })
                                    }}
                                >
                                    Change cover
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onUpdate(item.id, { cover: undefined })}
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
                                    if (url) onUpdate(item.id, { cover: url })
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
                            <IconPicker
                                currentIcon={icon}
                                onIconSelect={handleIconChange}
                            >
                                <button
                                    className="text-5xl hover:bg-accent/50 rounded-lg p-2 transition-colors bg-background border border-border"
                                >
                                    {icon}
                                </button>
                            </IconPicker>
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
                                            value={(item as any)[prop.id.toLowerCase()] || item.properties?.[prop.id] || ((prop.name === 'Status') ? item.status : ((prop.name === 'Priority') ? item.priority : ''))}
                                            options={prop.options || []}
                                            onChange={(value) => handlePropertyChange(prop.id.toLowerCase(), value)}
                                        />
                                    )}
                                    {prop.type === 'TEXT' && (
                                        <input
                                            type="text"
                                            value={(item as any)[prop.id.toLowerCase()] || item.properties?.[prop.id] || ''}
                                            onChange={(e) => handlePropertyChange(prop.id.toLowerCase(), e.target.value)}
                                            placeholder="Empty"
                                            className="w-full bg-transparent border-none outline-none text-sm focus:ring-0"
                                        />
                                    )}
                                    {prop.type === 'DATE' && (
                                        <input
                                            type="text" // Keep as text for now to match string format in mock data, or use date picker if verifying
                                            value={item.date || ''}
                                            onChange={(e) => handlePropertyChange('date', e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm focus:ring-0 w-full"
                                            placeholder="Select date..."
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Body - Block Editor */}
                    <div className="min-h-[300px]">
                        <BlockEditor
                            key={item.id}
                            initialBlocks={blocks}
                            onChange={handleBlocksChange}
                            readOnly={false}
                        />
                    </div>
                </div>
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
