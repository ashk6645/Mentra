'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '../types'

interface HeadingBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string, initialContent?: Record<string, unknown>) => void
    level: 1 | 2 | 3
    isEditing?: boolean
}

export function HeadingBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    level,
}: HeadingBlockProps) {
    const content = block.content as { text?: string }
    const [text, setText] = useState(content.text || '')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value
        setText(newText)
        onUpdate({ text: newText })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = inputRef.current
        if (!input) return

        const cursorPosition = input.selectionStart || 0
        const textBeforeCursor = text.substring(0, cursorPosition)
        const textAfterCursor = text.substring(cursorPosition)

        // Enter creates new text block below
        if (e.key === 'Enter') {
            e.preventDefault()
            
            // If there's text after cursor, split it
            if (textAfterCursor) {
                // Update current block with text before cursor
                setText(textBeforeCursor)
                onUpdate({ text: textBeforeCursor })
                
                // Create new text block with text after cursor
                onAddBlock('TEXT', block.id, { text: textAfterCursor })
            } else {
                // Just create new empty text block
                onAddBlock('TEXT', block.id)
            }
        }

        // Backspace at start of empty block - delete block
        if (e.key === 'Backspace' && cursorPosition === 0 && text === '') {
            e.preventDefault()
            onDelete()
        }
    }

    const sizeClasses = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-semibold',
        3: 'text-xl font-medium',
    }

    const placeholders = {
        1: 'Heading 1',
        2: 'Heading 2',
        3: 'Heading 3',
    }

    return (
        <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[level]}
            className={cn(
                "w-full bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0",
                sizeClasses[level]
            )}
        />
    )
}
