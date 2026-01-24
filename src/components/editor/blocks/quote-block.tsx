import React, { useRef } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'

interface QuoteBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: (id: string) => void
}

export const QuoteBlock = React.forwardRef<HTMLElement, QuoteBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''
        const innerRef = useRef<HTMLElement>(null)
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        return (
            <div className="flex my-2">
                <div className="w-1 bg-gray-900 dark:bg-gray-100 rounded-full mr-4 shrink-0 self-stretch" />
                <ContentEditable
                    innerRef={innerRef}
                    html={text}
                    disabled={false}
                    onChange={handleChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    onBlur={() => onBlur(block.id)}
                    className={cn(
                        "flex-1 outline-none break-words whitespace-pre-wrap text-lg italic text-gray-700 dark:text-gray-300 min-h-[1.5em]",
                        !text && "empty:before:content-['Empty_quote'] empty:before:text-gray-400 empty:before:pointer-events-none"
                    )}
                    tagName="blockquote"
                />
            </div>
        )
    }
)

QuoteBlock.displayName = 'QuoteBlock'
