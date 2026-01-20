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
            // Reset cursor to start? Or end? Usually end if splitting?
            // For now just focus.
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
        // Universal Slash Menu
        if (e.key === '/') {
            // Can be enhanced to only trigger if it's the start of line or standalone
            // For now, simple trigger
            e.preventDefault()
            onOpenSlashMenu()
            return
        }

        // Shift+Enter creates new block (exit current block)
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            // Immediately blur to give instant feedback
            if (textareaRef.current) {
                textareaRef.current.blur()
            }
            // Create new block
            onAddBlock('TEXT', block.id)
        }
        // Regular Enter just creates a new line (default textarea behavior)
        // No need to handle it - let the textarea handle it naturally

        // Backspace on empty block deletes it
        if (e.key === 'Backspace' && text === '') {
            e.preventDefault()
            onDelete()
        }
    }

    return (
        <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type something..."
            className="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder:text-muted-foreground/40 focus:ring-0 min-h-[1.5rem]"
            rows={1}
        />
    )
}
