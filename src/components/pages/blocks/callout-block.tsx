'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Block, BlockType } from '../types'

interface CalloutBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string, initialContent?: Record<string, unknown>) => void
    isEditing?: boolean
}

const CALLOUT_ICONS = ['💡', '⚠️', '📌', '🔥', '✅', '❌', '📝', '🎯', '💬', '🚀']
const CALLOUT_COLORS = [
    { name: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-900' },
    { name: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900' },
    { name: 'green', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-900' },
    { name: 'red', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900' },
    { name: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-900' },
    { name: 'gray', bg: 'bg-muted/50', border: 'border-border' },
]

export function CalloutBlock({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
}: CalloutBlockProps) {
    const content = block.content as { text?: string; icon?: string; color?: string }
    const [text, setText] = useState(content.text || '')
    const [icon, setIcon] = useState(content.icon || '💡')
    const [colorName, setColorName] = useState(content.color || 'yellow')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const selectedColor = CALLOUT_COLORS.find(c => c.name === colorName) || CALLOUT_COLORS[0]

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
        onUpdate({ text: newText, icon, color: colorName })
    }

    const handleIconClick = () => {
        const currentIndex = CALLOUT_ICONS.indexOf(icon)
        const nextIndex = (currentIndex + 1) % CALLOUT_ICONS.length
        const newIcon = CALLOUT_ICONS[nextIndex]
        setIcon(newIcon)
        onUpdate({ text, icon: newIcon, color: colorName })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const cursorPosition = textarea.selectionStart
        const textBeforeCursor = text.substring(0, cursorPosition)
        const textAfterCursor = text.substring(cursorPosition)

        // Shift+Enter creates new block outside callout
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            
            // If there's text after cursor, split it
            if (textAfterCursor) {
                // Update current block with text before cursor
                setText(textBeforeCursor)
                onUpdate({ text: textBeforeCursor, icon, color: colorName })
                
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
        // Regular Enter creates new line within callout (default behavior)

        if (e.key === 'Backspace' && text === '') {
            e.preventDefault()
            onDelete()
        }
    }

    return (
        <div className={cn(
            "flex gap-3 p-4 rounded-lg border",
            selectedColor.bg,
            selectedColor.border
        )}>
            <button
                onClick={handleIconClick}
                className="text-xl flex-shrink-0 hover:scale-110 transition-transform"
                title="Click to change icon"
            >
                {icon}
            </button>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type something..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:ring-0 min-h-[1.5rem]"
                rows={1}
            />
        </div>
    )
}
