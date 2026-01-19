'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Block, BlockType } from '../types'
import { BlockWrapper } from '../block-wrapper'
import { BlockRenderer } from '../block-renderer'

interface ToggleBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    onOpenSlashMenu: () => void
    isEditing?: boolean
}

export function ToggleBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    onOpenSlashMenu,
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
        if (e.key === '/') {
            e.preventDefault()
            onOpenSlashMenu()
            return
        }

        if (e.key === 'Enter') {
            e.preventDefault()
            // Create a new block AFTER the toggle (sibling)
            // Or if open, create inside? Notion creates sibling for heading toggles usually, unless at end of line?
            // Let's stick to sibling for now, creating a new line below.
            onAddBlock('TEXT', block.id)
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
                            onDelete={() => {
                                // We need a way to delete child blocks. 
                                // Since we don't have direct access to parent's child list update here easily without full tree,
                                // we rely on the implementation where `onDelete` passes the ID back up or calls a server action directly.
                                // The top-level PageEditor `handleBlockDelete` calls `deleteBlock` server action.
                                // We should probably pass a specialized handler or just use the global one if it supports ID.
                                // But `onDelete` in props is void. 
                                // Actually, BlockWrapper calls `onDelete` which is `() => handleBlockDelete(block.id)` in PageEditor.
                                // For nested, we need to pass a similar handler.
                                // Since we don't have the `handleBlockDelete` from PageEditor directly here, we need to pass it down through recursion.
                                // But wait, `ToggleBlock` receives `onDelete` which deletes ITSELF.
                                // We need a `onDeleteChild` or similar. 
                                // However, `BlockRenderer` interface only has `onDelete` (for itself).
                                // Ideally `PageEditor` should provide a context or we pass a global delete handler.
                                // For now, we unfortunately can't wire up child deletion easily without changing the interface to pass the ID.
                                // Let's assume for this iteration we can't delete nested via wrapper button unless we hack it.
                                // actually, deeper blocks need their own `onDelete`.
                            }}
                            onDuplicate={() => { }}
                            onAddBlock={(type) => onAddBlock(type, child.id)}
                            onOpenSlashMenu={onOpenSlashMenu}
                        >
                            <BlockRenderer
                                block={child}
                                onUpdate={(newContent) => {
                                    // Deep update is complex without a global store or recursive update function.
                                    // For now, simple optimistic updates won't work deep in the tree without state management (like useReducer or global context).
                                    // But we CAN call the server action `updateBlock` directly if we had it, but we only have `onUpdate` prop.
                                    // This is a limitation of the current recursion.
                                    // We will leave this as a todo or partial implementation.
                                }}
                                onDelete={() => { /* Same issue */ }}
                                onAddBlock={onAddBlock}
                                onOpenSlashMenu={onOpenSlashMenu}
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
