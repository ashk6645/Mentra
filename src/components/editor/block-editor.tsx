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
    // New state to track desired cursor position
    const [focusedBlockCursor, setFocusedBlockCursor] = useState<{ id: string; offset: number } | null>(null)

    // Slash Action Menu State
    const [slashMenuState, setSlashMenuState] = useState<{
        isOpen: boolean
        blockId: string | null
        position: { top: number; left: number } | null
        query: string
        placement?: 'top' | 'bottom'
    }>({
        isOpen: false,
        blockId: null,
        position: null,
        query: '',
        placement: 'bottom'
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
        // 1. Get raw text (no trim initially to preserve position)
        const textContent = (document.createElement('div').textContent = content.text || '') || ''

        // Use DOM text extraction if needed, but for logic we need exact text
        // We'll stick to a simpler approach first as per instructions "Step 1: Get raw text"
        // But content.text IS HTML.
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content.text || ''
        const text = tempDiv.textContent || ''

        // 2. Get cursor position
        const selection = window.getSelection()
        if (!selection || !selection.isCollapsed) {
            if (slashMenuState.isOpen) closeSlashMenu()
            return
        }

        // We need to be careful: selection.anchorOffset is relative to the NODE.
        // If content is strict text, it works.
        // If content has spans, anchorOffset is relative to that span.
        // FOR NOW: We assume simple text block. If it fails for complex HTML, we need more robust cursor logic.
        // But user provided code: "const cursorOffset = selection.anchorOffset"
        const cursorOffset = selection.anchorOffset

        // 3. Only analyze text before cursor
        const beforeCursor = text.slice(0, cursorOffset)

        // 4. Find last slash
        const slashIndex = beforeCursor.lastIndexOf('/')
        if (slashIndex === -1) {
            if (slashMenuState.isOpen) closeSlashMenu()
            return
        }

        // 5. Validate slash context
        // Slash must be at start (index 0) or preceded by whitespace
        if (slashIndex > 0 && !/\s/.test(beforeCursor[slashIndex - 1])) {
            if (slashMenuState.isOpen) closeSlashMenu()
            return
        }

        // 6. Extract query
        const query = beforeCursor.slice(slashIndex + 1)

        // Space ends slash mode
        if (query.includes(' ')) {
            if (slashMenuState.isOpen) closeSlashMenu()
            return
        }

        // 7. Open / update menu
        const blockElement = document.querySelector(`[data-block-id="${id}"]`)
        if (blockElement) {
            const rect = blockElement.getBoundingClientRect()

            // Determine placement based on available space
            const spaceBelow = window.innerHeight - rect.bottom
            const menuHeightEst = 320
            const placement = spaceBelow < menuHeightEst ? 'top' : 'bottom'
            const top = placement === 'top' ? rect.top : rect.bottom

            setSlashMenuState({
                isOpen: true,
                blockId: id,
                query,
                position: { top, left: rect.left },
                placement
            })
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
            const currentBlock = blocks.find(b => b.id === blockId)
            const index = blocks.findIndex(b => b.id === blockId)

            // Check for empty block (robust check)
            const textContent = currentBlock?.content?.text || ''
            // Strip HTML tags and replace &nbsp; with space
            const plainText = textContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
            const isEmpty = plainText === ''

            // 1. If block is empty and not the first block, delete it and focus previous
            if (currentBlock && index > 0 && isEmpty) {
                e.preventDefault()
                const prevBlock = blocks[index - 1]

                // Before removing, we need to know where to put cursor in prev block
                // Standard behavior is "end of prev block".
                const prevContent = prevBlock.content.text || ''
                // Calculate length of plain text for cursor offset? 
                // Actually contentEditable cursor offset is relative to text node usually.
                // If prevContent has HTML, valid offset might be tricky without DOM.
                // But typically our blocks are simple text. 
                // We'll set cursor offset to a large number to ensure "end"? 
                // Or just `prevContent.length` if it's text.
                // Use a safe heuristic.
                const prevLen = prevContent.replace(/<[^>]*>/g, '').length // Approx text length

                removeBlock(blockId)
                setFocusedBlockId(prevBlock.id)
                // Set cursor to end
                setFocusedBlockCursor({ id: prevBlock.id, offset: prevLen }) // Or just prevLen
                onDeleteBlock?.(blockId)
                return
            }

            // 2. If block has content, but cursor is at START, merge with previous
            const selection = window.getSelection()
            // We need to be careful with "isAtStart" in ContentEditable.
            // If anchorOffset is 0 and isCollapsed, we are likely at start.
            const isAtStart = selection && selection.isCollapsed && selection.anchorOffset === 0

            if (currentBlock && index > 0 && isAtStart && !isEmpty) {
                const prevBlock = blocks[index - 1]

                // Allow merging Text-like blocks
                const isCurrentText = ['TEXT', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'BULLETED_LIST', 'NUMBERED_LIST', 'TODO_LIST'].includes(currentBlock.type)
                const isPrevText = ['TEXT', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'BULLETED_LIST', 'NUMBERED_LIST', 'TODO_LIST'].includes(prevBlock.type)

                if (isCurrentText && isPrevText) {
                    e.preventDefault()

                    const prevText = prevBlock.content.text || ''
                    const currentText = currentBlock.content.text || ''

                    // Update previous block with merged text
                    updateBlock(prevBlock.id, {
                        content: { ...prevBlock.content, text: prevText + currentText }
                    })

                    // Remove current
                    removeBlock(blockId)
                    setFocusedBlockId(prevBlock.id)
                    setFocusedBlockCursor({ id: prevBlock.id, offset: prevText.length })
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
                        {(() => {
                            let numberCounter = 0;
                            return blocks.map(block => {
                                // Calculate numbering: increment if NUMBERED_LIST, else reset
                                if (block.type === 'NUMBERED_LIST') {
                                    numberCounter++;
                                } else {
                                    numberCounter = 0;
                                }
                                const currentNumber = numberCounter > 0 ? numberCounter : undefined;

                                return (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        isFocused={focusedBlockId === block.id}
                                        cursorOffset={focusedBlockCursor?.id === block.id ? focusedBlockCursor.offset : null}
                                        numberedListIndex={currentNumber}
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
                                )
                            })
                        })()}
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
