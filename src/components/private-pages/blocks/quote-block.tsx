'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Block, BlockType } from '../types'

interface QuoteBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onAddBlock('TEXT', block.id)
        }
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
