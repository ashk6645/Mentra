'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Block, BlockType } from '../types'

interface TextBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    isEditing?: boolean
}

export function TextBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
}: TextBlockProps) {
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
        // Enter creates new block
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onAddBlock('TEXT', block.id)
        }

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
