'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { BlockType, BLOCK_MENU_ITEMS, BlockMenuItem } from './types'

interface SlashMenuProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (type: BlockType) => void
    position?: { x: number; y: number }
}

export function SlashMenu({
    isOpen,
    onClose,
    onSelect,
    position,
}: SlashMenuProps) {
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Filter items by search
    const filteredItems = useMemo(() => {
        if (!search) return BLOCK_MENU_ITEMS
        const lowerSearch = search.toLowerCase()
        return BLOCK_MENU_ITEMS.filter(
            (item) =>
                item.label.toLowerCase().includes(lowerSearch) ||
                item.description.toLowerCase().includes(lowerSearch)
        )
    }, [search])

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, BlockMenuItem[]> = {
            database: [],
            basic: [],
            media: [],
        }
        filteredItems.forEach((item) => {
            groups[item.category].push(item)
        })
        return groups
    }, [filteredItems])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
            setSearch('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose()
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex((i) => Math.max(i - 1, 0))
                    break
                case 'Enter':
                    e.preventDefault()
                    if (filteredItems[selectedIndex]) {
                        onSelect(filteredItems[selectedIndex].type)
                    }
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredItems, selectedIndex, onSelect, onClose])

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const renderCategory = (title: string, items: BlockMenuItem[], startIndex: number) => {
        if (items.length === 0) return null
        return (
            <div key={title}>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {title}
                </div>
                {items.map((item, idx) => {
                    const globalIndex = startIndex + idx
                    return (
                        <button
                            key={item.type}
                            onClick={() => onSelect(item.type)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                                globalIndex === selectedIndex
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <span className="w-8 h-8 flex items-center justify-center bg-muted/50 rounded text-lg">
                                {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        )
    }

    // Calculate cumulative indices for proper selection
    let cumulativeIndex = 0
    const databaseStartIndex = cumulativeIndex
    cumulativeIndex += groupedItems.database.length
    const basicStartIndex = cumulativeIndex
    cumulativeIndex += groupedItems.basic.length
    const mediaStartIndex = cumulativeIndex

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-80 max-h-96 overflow-hidden bg-popover border border-border rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95"
            style={position ? { left: position.x, top: position.y } : undefined}
        >
            {/* Search Input */}
            <div className="p-2 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setSelectedIndex(0)
                        }}
                        placeholder="Search blocks..."
                        className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border-none rounded text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Menu Items */}
            <div className="overflow-y-auto max-h-72 py-1">
                {filteredItems.length === 0 ? (
                    <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                        No blocks found
                    </div>
                ) : (
                    <>
                        {renderCategory('Database Views', groupedItems.database, databaseStartIndex)}
                        {renderCategory('Basic Blocks', groupedItems.basic, basicStartIndex)}
                        {renderCategory('Media', groupedItems.media, mediaStartIndex)}
                    </>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> to navigate,{' '}
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to select
            </div>
        </div>
    )
}
