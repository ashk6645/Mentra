'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Block, BlockType } from '../types'
import { BlockWrapper } from '../block-wrapper'
import { BlockRenderer } from '../block-renderer'
import { updateBlock, deleteBlock } from '@/lib/actions/blocks'

interface ToggleBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string, initialContent?: Record<string, unknown>) => void
    onOpenSlashMenu: () => void
    focusedBlockId?: string | null
    isEditing?: boolean
}

export function ToggleBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    onOpenSlashMenu,
    focusedBlockId,
    isEditing
}: ToggleBlockProps) {
    const content = block.content as { text: string; isOpen?: boolean }
    const isOpen = content.isOpen ?? true

    const handleToggle = () => {
        onUpdate({ ...content, isOpen: !isOpen })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...content, text: e.target.value })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget
        const cursorPosition = input.selectionStart || 0
        const textBeforeCursor = (content.text || '').substring(0, cursorPosition)
        const textAfterCursor = (content.text || '').substring(cursorPosition)

        if (e.key === '/') {
            e.preventDefault()
            onOpenSlashMenu()
            return
        }

        if (e.key === 'Enter') {
            e.preventDefault()
            
            // If there's text after cursor, split it
            if (textAfterCursor) {
                // Update current block with text before cursor
                onUpdate({ ...content, text: textBeforeCursor })
                
                // Create new text block with text after cursor
                onAddBlock('TEXT', block.id, { text: textAfterCursor })
            } else {
                // Just create new empty text block
                onAddBlock('TEXT', block.id)
            }
        }

        if (e.key === 'Backspace' && (!content.text || content.text === '')) {
            e.preventDefault()
            onDelete()
        }
    }

    // Determine styles based on block type
    const isHeading = block.type.includes('HEADING')
    const level = block.type === 'TOGGLE_HEADING_1' ? 1
        : block.type === 'TOGGLE_HEADING_2' ? 2
            : block.type === 'TOGGLE_HEADING_3' ? 3
                : 0

    const textStyles = isHeading
        ? cn(
            "font-bold bg-transparent border-none outline-none focus:ring-0 w-full",
            level === 1 && "text-3xl mt-6 mb-2",
            level === 2 && "text-2xl mt-5 mb-2",
            level === 3 && "text-xl mt-3 mb-1",
        )
        : "bg-transparent border-none outline-none focus:ring-0 w-full text-base"

    return (
        <div className="w-full">
            <div className="flex items-start group">
                {/* Toggle Button */}
                <button
                    onClick={handleToggle}
                    className={cn(
                        "p-1 mr-1 rounded hover:bg-muted text-muted-foreground transition-colors mt-0.5",
                        isHeading && level === 1 && "mt-7",
                        isHeading && level === 2 && "mt-6",
                        isHeading && level === 3 && "mt-4",
                    )}
                >
                    <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                </button>

                {/* Content Input */}
                <input
                    type="text"
                    value={content.text || ''}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag interference
                    placeholder={isHeading ? `Heading ${level}` : "Toggle list"}
                    className={textStyles}
                />
            </div>

            {/* Children */}
            {isOpen && (
                <div className="pl-6 mt-1 space-y-0.5 border-l-2 border-border/10 ml-2.5">
                    {block.childBlocks && block.childBlocks.map((child) => (
                        <BlockWrapper
                            key={child.id}
                            block={child}
                            onDelete={async () => {
                                // Call server action directly to delete nested block
                                await deleteBlock(child.id)
                            }}
                            onDuplicate={() => { }}
                            onAddBlock={(type) => onAddBlock(type, child.id)}
                            onOpenSlashMenu={onOpenSlashMenu}
                        >
                            <BlockRenderer
                                block={child}
                                onUpdate={async (newContent) => {
                                    // Call server action directly to update nested block
                                    await updateBlock(child.id, { content: newContent })
                                }}
                                onDelete={async () => {
                                    // Call server action directly to delete nested block
                                    await deleteBlock(child.id)
                                }}
                                onAddBlock={onAddBlock}
                                onOpenSlashMenu={onOpenSlashMenu}
                                focusedBlockId={focusedBlockId}
                            />
                        </BlockWrapper>
                    ))}

                    {/* Placeholder for adding first child if empty? */}
                    {(!block.childBlocks || block.childBlocks.length === 0) && (
                        <div
                            className="text-muted-foreground/40 text-sm px-2 py-1 cursor-text hover:bg-accent/10 rounded"
                            onClick={() => onAddBlock('TEXT', block.id + '_nested_start')} // Hacky way to signal nested start?
                        >
                            Empty toggle. Click to add content...
                        </div>
                    )}
                </div>
            )}

            {/* Empty state placeholder for children? No, dnd-kit handles insertion */}
        </div>
    )
}
