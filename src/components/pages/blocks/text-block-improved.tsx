'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Block, BlockType } from '../types'

interface TextBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    onOpenSlashMenu: () => void
    focusedBlockId?: string | null
    isEditing?: boolean
}

export function TextBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    onOpenSlashMenu,
    focusedBlockId,
}: TextBlockProps) {
    const content = block.content as { text?: string }
    const [text, setText] = useState(content.text || '')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-focus if this block is the newly created one
    useEffect(() => {
        if (focusedBlockId === block.id && textareaRef.current) {
            textareaRef.current.focus()
            // Move cursor to end
            const length = textareaRef.current.value.length
            textareaRef.current.setSelectionRange(length, length)
        }
    }, [focusedBlockId, block.id])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        }
    }, [text])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value
        setText(newText)
        onUpdate({ text: newText })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const cursorPosition = textarea.selectionStart
        const textBeforeCursor = text.substring(0, cursorPosition)
        const textAfterCursor = text.substring(cursorPosition)

        // Slash menu trigger - only at start of line or after space
        if (e.key === '/' && (cursorPosition === 0 || textBeforeCursor.endsWith(' '))) {
            // Let the slash be typed, then trigger menu
            setTimeout(() => {
                onOpenSlashMenu()
            }, 0)
            return
        }

        // Enter key - create new block
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            
            // If there's text after cursor, split it
            if (textAfterCursor) {
                // Update current block with text before cursor
                setText(textBeforeCursor)
                onUpdate({ text: textBeforeCursor })
                
                // Create new block with text after cursor
                // This would need to be handled by parent to set initial content
                onAddBlock('TEXT', block.id)
            } else {
                // Just create new empty block
                onAddBlock('TEXT', block.id)
            }
        }

        // Shift+Enter - just new line (default behavior)
        // No need to handle

        // Backspace at start of block - delete block and merge with previous
        if (e.key === 'Backspace' && cursorPosition === 0) {
            e.preventDefault()
            // Only delete if block is empty
            if (text === '') {
                onDelete()
            }
            // If block has content, let parent handle merging
            // This would need parent support
        }
    }

    return (
        <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands"
            className="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder:text-muted-foreground/40 focus:ring-0 min-h-[1.5rem]"
            rows={1}
        />
    )
}
