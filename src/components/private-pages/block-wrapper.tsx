'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical, Plus, Trash2, Copy, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Block, BlockType } from './types'

interface BlockWrapperProps {
    block: Block
    children: React.ReactNode
    onDelete: () => void
    onDuplicate: () => void
    onAddBlock: (type: BlockType) => void
    onOpenSlashMenu: () => void
    isDragging?: boolean
    dragHandleProps?: Record<string, unknown>
}

export function BlockWrapper({
    block,
    children,
    onDelete,
    onDuplicate,
    onAddBlock,
    onOpenSlashMenu,
    isDragging,
    dragHandleProps,
}: BlockWrapperProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div
            className={cn(
                "group relative flex items-start gap-1 py-0.5 -ml-8 pl-8 rounded transition-colors",
                isHovered && "bg-accent/20",
                isDragging && "opacity-50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Left Controls */}
            <div
                className={cn(
                    "absolute left-0 flex items-center gap-0.5 transition-opacity",
                    isHovered || showMenu ? "opacity-100" : "opacity-0"
                )}
            >
                {/* Add Block Button */}
                <button
                    onClick={onOpenSlashMenu}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Add block below"
                >
                    <Plus className="h-4 w-4" />
                </button>

                {/* Drag Handle / More Options */}
                <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
                            {...dragHandleProps}
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={onDuplicate}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Block Content */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    )
}
