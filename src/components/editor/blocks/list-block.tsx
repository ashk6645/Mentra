import React, { useRef } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'
import { Circle, Square } from 'lucide-react'

interface ListBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: (id: string) => void
    numberedListIndex?: number
}

export const ListBlock = React.forwardRef<HTMLElement, ListBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur, numberedListIndex }, ref) => {
        const text = content.text || ''
        const innerRef = useRef<HTMLElement>(null)
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        return (
            <div className="flex items-start gap-2 py-1">
                <div className="mt-1.5 select-none w-5 flex justify-center">
                    {block.type === 'BULLETED_LIST' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                    )}
                    {block.type === 'NUMBERED_LIST' && (
                        <span className="text-sm font-medium text-gray-500 select-none">
                            {numberedListIndex ? `${numberedListIndex}.` : '1.'}
                        </span>
                    )}
                </div>
                <ContentEditable
                    innerRef={innerRef}
                    html={text}
                    disabled={false}
                    onChange={handleChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    onBlur={() => onBlur(block.id)}
                    className={cn(
                        "flex-1 outline-none break-words whitespace-pre-wrap min-h-[1.5em]",
                        !text && "empty:before:content-['List_item'] empty:before:text-gray-300 empty:before:pointer-events-none"
                    )}
                    tagName="div"
                />
            </div>
        )
    }
)

ListBlock.displayName = 'ListBlock'
