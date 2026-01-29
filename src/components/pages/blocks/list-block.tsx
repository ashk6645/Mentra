'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '../types'
import { Check } from 'lucide-react'

interface ListBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string, initialContent?: Record<string, unknown>) => void
    variant: 'bulleted' | 'numbered' | 'todo'
    number?: number
    isEditing?: boolean
}

export function ListBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    variant,
    number = 1,
}: ListBlockProps) {
    const content = block.content as { text?: string; isChecked?: boolean }
    const [text, setText] = useState(content.text || '')
    const [isChecked, setIsChecked] = useState(content.isChecked || false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value
        setText(newText)
        onUpdate({ text: newText, isChecked })
    }

    const handleCheck = () => {
        const newChecked = !isChecked
        setIsChecked(newChecked)
        onUpdate({ text, isChecked: newChecked })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = inputRef.current
        if (!input) return

        const cursorPosition = input.selectionStart || 0
        const textBeforeCursor = text.substring(0, cursorPosition)
        const textAfterCursor = text.substring(cursorPosition)

        // Enter creates same type of list item
        if (e.key === 'Enter') {
            e.preventDefault()
            const blockType = variant === 'bulleted' ? 'BULLETED_LIST'
                : variant === 'numbered' ? 'NUMBERED_LIST'
                    : 'TODO_LIST'
            
            // If there's text after cursor, split it
            if (textAfterCursor) {
                // Update current block with text before cursor
                setText(textBeforeCursor)
                onUpdate({ text: textBeforeCursor, isChecked })
                
                // Create new list item with text after cursor
                const newContent = variant === 'todo' 
                    ? { text: textAfterCursor, isChecked: false }
                    : { text: textAfterCursor }
                onAddBlock(blockType, block.id, newContent)
            } else {
                // Just create new empty list item
                const newContent = variant === 'todo' 
                    ? { text: '', isChecked: false }
                    : { text: '' }
                onAddBlock(blockType, block.id, newContent)
            }
        }

        // Backspace at start of empty block - delete block
        if (e.key === 'Backspace' && cursorPosition === 0 && text === '') {
            e.preventDefault()
            onDelete()
        }
    }

    return (
        <div className="flex items-start gap-2">
            {/* Marker */}
            {variant === 'bulleted' && (
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/60" />
            )}

            {variant === 'numbered' && (
                <span className="flex-shrink-0 text-sm text-muted-foreground font-medium tabular-nums w-5">
                    {number}.
                </span>
            )}

            {variant === 'todo' && (
                <button
                    onClick={handleCheck}
                    className={cn(
                        "flex-shrink-0 mt-0.5 w-4 h-4 rounded border transition-all",
                        isChecked
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40 hover:border-primary"
                    )}
                >
                    {isChecked && <Check className="w-full h-full text-primary-foreground p-0.5" />}
                </button>
            )}

            {/* Text input */}
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={variant === 'todo' ? 'To-do' : 'List item'}
                className={cn(
                    "flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/40 focus:ring-0",
                    isChecked && variant === 'todo' && "line-through text-muted-foreground"
                )}
            />
        </div>
    )
}
