import React, { useCallback, useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { Block, BlockType } from './types'
import { useBlockEditor } from './use-block-editor'
import { SortableBlock } from './sortable-block'
import { SlashCommandMenu } from './slash-command-menu'

interface BlockEditorProps {
    initialBlocks?: Block[]
    onChange?: (blocks: Block[]) => void
    onUpdateBlock?: (id: string, content: any) => void
    onCreateBlock?: (block: Block, afterBlockId?: string) => void
    onDeleteBlock?: (id: string) => void
    onReorderBlocks?: (blocks: Block[]) => void
}

export function BlockEditor({
    initialBlocks = [],
    onChange,
    onUpdateBlock,
    onCreateBlock,
    onDeleteBlock,
    onReorderBlocks
}: BlockEditorProps) {
    const { blocks, addBlock, updateBlock, removeBlock, setBlocks } = useBlockEditor({
        initialBlocks,
        onChange
    })

    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)

    // Slash Action Menu State
    const [slashMenuState, setSlashMenuState] = useState<{
        isOpen: boolean
        blockId: string | null
        position: { top: number; left: number } | null
        query: string
    }>({
        isOpen: false,
        blockId: null,
        position: null,
        query: ''
    })

    // Close menu helper
    const closeSlashMenu = useCallback(() => {
        setSlashMenuState(prev => ({ ...prev, isOpen: false }))
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((item) => item.id === active.id)
            const newIndex = blocks.findIndex((item) => item.id === over.id)
            const newBlocks = arrayMove(blocks, oldIndex, newIndex)
            setBlocks(newBlocks)
            onReorderBlocks?.(newBlocks)
        }
    }

    const handleFocus = useCallback((id: string) => {
        setFocusedBlockId(id)
    }, [])

    const handleBlur = useCallback((id: string) => {
        if (focusedBlockId === id) {
            setFocusedBlockId(null)
        }
    }, [focusedBlockId])

    // Just a simple heuristic: if a block text starts with /, show menu
    // We'll pass a special "onKeyUp" or similar to blocks to detect slash command trigger
    // For now, let's implement a wrapper or logic in `onChange` of blocks

    const handleBlockChange = useCallback((id: string, content: any) => {
        // Basic Slash Command Trigger Logic
        // If we are editing text and it starts with /, show menu
        // real implementation requires cursor coordinates
        if (content.text && (content.text as string).startsWith('/')) {
            // We need to find the DOM element to position the menu
            const blockElement = document.querySelector(`[data-block-id="${id}"]`)
            if (blockElement) {
                const rect = blockElement.getBoundingClientRect()
                setSlashMenuState({
                    isOpen: true,
                    blockId: id,
                    position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
                    query: (content.text as string).substring(1) // Remove leading /
                })
                return
            }
        } else {
            if (slashMenuState.isOpen && slashMenuState.blockId === id) {
                closeSlashMenu()
            }
        }

        updateBlock(id, { content })
        onUpdateBlock?.(id, { content })
    }, [updateBlock, slashMenuState.isOpen, slashMenuState.blockId, closeSlashMenu, onUpdateBlock])


    const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
        if (slashMenuState.isOpen) {
            // Let the menu handle arrow keys and enter if open
            // But we are at the block level here. 
            // We might need to stop propagation or handle it globally.
            // Actually, the menu is global.
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
                // Prevent default editor behavior if menu is open
                // But we need to dispatch these to the menu?
                // The menu has its own listener on document.
                // So we just need to prevent block navigation.
                if (e.key === 'Enter') e.preventDefault()
                if (e.key === 'ArrowUp') e.preventDefault()
                if (e.key === 'ArrowDown') e.preventDefault()
                return // Let global listener handle it
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault()

            // Check current block type
            const currentBlock = blocks.find(b => b.id === blockId)

            if (e.shiftKey) {
                // Shift+Enter: Always exit list/structure to a new Text block
                const addedId = addBlock('TEXT', {}, blockId)
                setFocusedBlockId(addedId)
                if (onCreateBlock) {
                    const createdBlock: Block = {
                        id: addedId,
                        type: 'TEXT',
                        content: {},
                        sortOrder: 0,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                    onCreateBlock(createdBlock, blockId)
                }
                return
            }

            // Regular Enter
            // If Text: New Text Block
            // If List: New List Block (continue list)
            // If Empty List: Break out to Text (optional, but requested behavior implies Shift+Enter handles breakout)
            // But usually "Enter on empty list item" -> Text is standard. 
            // The user said "press enter then it should continue the list", so we continue.

            let nextType: BlockType = 'TEXT'
            if (currentBlock) {
                if (currentBlock.type === 'BULLETED_LIST' || currentBlock.type === 'NUMBERED_LIST' || currentBlock.type === 'TODO_LIST') {
                    nextType = currentBlock.type
                }
            }

            // Handle empty list item -> Break out (Standard Logic, good for UX even if user didn't explicitly ask, it prevents trapping)
            const isEmpty = !currentBlock?.content.text || currentBlock.content.text === ''
            if (isEmpty && nextType !== 'TEXT') {
                // Convert current empty list item to Text? Or just make next one text?
                // Usually converting current "empty list item" to "text" is better.
                updateBlock(blockId, { type: 'TEXT' })
                // And stay focused? Or just done?
                // We don't need to add new block if we just converted this one.
                // onUpdateBlock handle type change? We need to ensure it propagates.
                onUpdateBlock?.(blockId, { type: 'TEXT' })
                return
            }

            const addedId = addBlock(nextType, {}, blockId)
            setFocusedBlockId(addedId)

            if (onCreateBlock) {
                const createdBlock: Block = {
                    id: addedId,
                    type: nextType,
                    content: {},
                    sortOrder: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
                onCreateBlock(createdBlock, blockId)
            }

        } else if (e.key === 'Backspace') {

        } else if (e.key === 'Backspace') {
            const block = blocks.find(b => b.id === blockId)
            const isEmpty = !block?.content.text || block.content.text === ''

            if (isEmpty && blocks.length > 1) {
                e.preventDefault()
                const index = blocks.findIndex(b => b.id === blockId)
                if (index > 0) {
                    const prevBlock = blocks[index - 1]
                    setFocusedBlockId(prevBlock.id)
                    removeBlock(blockId)
                    onDeleteBlock?.(blockId)
                }
            }
        } else if (e.key === 'ArrowUp') {
            const index = blocks.findIndex(b => b.id === blockId)
            if (index > 0) {
                e.preventDefault()
                setFocusedBlockId(blocks[index - 1].id)
            }
        } else if (e.key === 'ArrowDown') {
            const index = blocks.findIndex(b => b.id === blockId)
            if (index < blocks.length - 1) {
                e.preventDefault()
                setFocusedBlockId(blocks[index + 1].id)
            }
        }
    }, [blocks, addBlock, removeBlock, slashMenuState.isOpen])

    const handleSlashSelect = useCallback((type: BlockType) => {
        if (slashMenuState.blockId) {
            // Convert the current block to the new type
            const updates = { type, content: { text: '' } }
            updateBlock(slashMenuState.blockId, updates)
            onUpdateBlock?.(slashMenuState.blockId, updates)

            // Usually we clear the '/' text.
            closeSlashMenu()
            // Focus?
            setFocusedBlockId(slashMenuState.blockId)
        }
    }, [slashMenuState.blockId, updateBlock, closeSlashMenu, onUpdateBlock])

    return (
        <div className="w-full max-w-3xl mx-auto min-h-[500px]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-1">
                    <SortableContext
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {blocks.map(block => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                isFocused={focusedBlockId === block.id}
                                // We intercept updateBlock here to check for slash commands!
                                // No wait, better to pass a specific handler?
                                // Let's pass updateBlock but wrapper it
                                updateBlock={(id, updates) => {
                                    // If it's a content update, check specifically
                                    if (updates.content) {
                                        handleBlockChange(id, updates.content)
                                    } else {
                                        updateBlock(id, updates)
                                    }
                                }}
                                addBlock={addBlock}
                                removeBlock={removeBlock}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                            />
                        ))}
                    </SortableContext>

                    {/* Empty State / Click to add at bottom */}
                    <div
                        className="min-h-[100px] cursor-text -ml-2 pl-2 mt-4"
                        onClick={() => {
                            // Always add a new block at the end
                            const id = addBlock()
                            setFocusedBlockId(id)

                            // Ensure we scroll to it?
                            // addBlock updates state, focus effect handles it?
                        }}
                    >
                        {blocks.length === 0 && (
                            <div className="text-gray-400">Click to add a block...</div>
                        )}
                    </div>
                </div>
            </DndContext>

            {/* Slash Command Menu */}
            {slashMenuState.isOpen && (
                <SlashCommandMenu
                    position={slashMenuState.position}
                    onSelect={handleSlashSelect}
                    onClose={closeSlashMenu}
                    query={slashMenuState.query}
                />
            )}
        </div>
    )
}
