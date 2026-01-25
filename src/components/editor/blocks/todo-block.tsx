import React, { useRef } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'
import { CheckSquare, Square } from 'lucide-react'

interface TodoBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: () => void
}

export const TodoBlock = React.forwardRef<HTMLElement, TodoBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''
        const checked = content.checked || false
        const innerRef = useRef<HTMLElement>(null)

        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        const toggleChecked = () => {
            onChange({ ...content, checked: !checked })
        }

        return (
            <div className="flex items-start gap-2 py-1">
                <div
                    className="mt-1 cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none flex-shrink-0"
                    onClick={toggleChecked}
                    contentEditable={false} // Prevent cursor entering
                >
                    {checked ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </div>
                <ContentEditable
                    innerRef={innerRef}
                    html={text}
                    disabled={false}
                    onChange={handleChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className={cn(
                        "flex-1 outline-none break-words whitespace-pre-wrap min-h-[1.5em] py-0.5",
                        checked && "line-through text-muted-foreground",
                        !text && "empty:before:content-['To-do'] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
                    )}
                    tagName="div"
                />
            </div>
        )
    }
)

TodoBlock.displayName = 'TodoBlock'
