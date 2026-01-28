import React, { useRef } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Block } from '../types'
import { cn } from '@/lib/utils'
import { Lightbulb } from 'lucide-react'

interface CalloutBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: (id: string) => void
}

export const CalloutBlock = React.forwardRef<HTMLElement, CalloutBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''
        const innerRef = useRef<HTMLElement>(null)
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        return (
            <div className="flex p-4 bg-muted/50 rounded-md gap-3 my-2 border border-border/50">
                <div className="select-none text-xl leading-snug">💡</div>
                <div className="flex-1 min-w-0">
                    <ContentEditable
                        innerRef={innerRef}
                        html={text}
                        disabled={false}
                        onChange={handleChange}
                        onKeyDown={onKeyDown}
                        onFocus={onFocus}
                        onBlur={() => onBlur(block.id)}
                        className={cn(
                            "outline-none break-words whitespace-pre-wrap min-h-[1.5em]",
                            !text && "empty:before:content-['Type_something...'] empty:before:text-muted-foreground/50 empty:before:pointer-events-none"
                        )}
                        tagName="div"
                    />
                </div>
            </div>
        )
    }
)

CalloutBlock.displayName = 'CalloutBlock'
