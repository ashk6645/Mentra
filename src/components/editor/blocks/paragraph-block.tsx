import React, { useRef, useEffect } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'

interface ParagraphBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: () => void
}

export const ParagraphBlock = React.forwardRef<HTMLElement, ParagraphBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''

        // Use a local ref if one isn't provided, to manage focus
        const innerRef = useRef<HTMLElement>(null)

        // Combine refs
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        return (
            <ContentEditable
                innerRef={innerRef}
                html={text}
                disabled={false}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                className={cn(
                    "min-h-[1.5em] outline-none break-words whitespace-pre-wrap py-1",
                    !text && "empty:before:content-['Type_''_for_commands'] empty:before:text-gray-400 empty:before:pointer-events-none"
                )}
                tagName="div"
            />
        )
    }
)

ParagraphBlock.displayName = 'ParagraphBlock'
