import React, { useRef, useEffect } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block, BlockType } from '../types'
import { cn } from '@/lib/utils'

interface HeadingBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: () => void
}

export const HeadingBlock = React.forwardRef<HTMLElement, HeadingBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''
        const innerRef = useRef<HTMLElement>(null)

        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        const getHeadingClass = (type: BlockType) => {
            switch (type) {
                case 'HEADING_1': return "text-3xl font-bold mt-6 mb-2"
                case 'HEADING_2': return "text-2xl font-semibold mt-4 mb-2"
                case 'HEADING_3': return "text-xl font-semibold mt-2 mb-1"
                default: return "text-base"
            }
        }

        const getPlaceholder = (type: BlockType) => {
            switch (type) {
                case 'HEADING_1': return "Heading 1"
                case 'HEADING_2': return "Heading 2"
                case 'HEADING_3': return "Heading 3"
                default: return "Heading"
            }
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
                    "outline-none break-words whitespace-pre-wrap",
                    getHeadingClass(block.type),
                    !text && "empty:before:content-[attr(placeholder)] empty:before:text-gray-300 empty:before:pointer-events-none"
                )}
                tagName={block.type === 'HEADING_1' ? 'h1' : block.type === 'HEADING_2' ? 'h2' : 'h3'}
                placeholder={getPlaceholder(block.type)}
            />
        )
    }
)

HeadingBlock.displayName = 'HeadingBlock'
