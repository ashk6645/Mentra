'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Block, BlockType } from '../types'

interface QuoteBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string, initialContent?: Record<string, unknown>) => void
    isEditing?: boolean
}

export function QuoteBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
}: QuoteBlockProps) {
    const content = block.content as { text?: string }
    const [text, setText] = useState(content.text || '')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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

        // Shift+Enter creates new block outside quote
        if (e.key === 'Enter' && e.shiftKey) {
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
            
            // Immediately blur for instant feedback
            if (textareaRef.current) {
                textareaRef.current.blur()
            }
        }
        // Regular Enter creates new line within quote (default behavior)

        if (e.key === 'Backspace' && text === '') {
            e.preventDefault()
            onDelete()
        }
    }

    return (
        <div className="border-l-4 border-muted-foreground/30 pl-4 py-1">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Quote..."
                className="w-full bg-transparent border-none outline-none resize-none text-base italic text-muted-foreground leading-relaxed placeholder:text-muted-foreground/40 focus:ring-0 min-h-[1.5rem]"
                rows={1}
            />
        </div>
    )
}
