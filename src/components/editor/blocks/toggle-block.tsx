import React, { useState, useRef, useEffect } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { ChevronRight } from 'lucide-react'
import { Block } from '../types'
import { cn } from '@/lib/utils'
import { BlockEditor } from '../block-editor'

interface ToggleBlockProps {
    block: Block
    content: any
    onChange: (content: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: (id: string) => void
}

export const ToggleBlock = React.forwardRef<HTMLElement, ToggleBlockProps>(
    ({ block, content, onChange, onKeyDown, onFocus, onBlur }, ref) => {
        const text = content.text || ''
        const isOpen = content.isOpen ?? false // Default closed or strictly controlled? 
        // Notion toggles are typically closed by default or persist state.

        const innerRef = useRef<HTMLElement>(null)
        React.useImperativeHandle(ref, () => innerRef.current!)

        const handleChange = (e: ContentEditableEvent) => {
            onChange({ ...content, text: e.target.value })
        }

        const toggleOpen = (e: React.MouseEvent) => {
            e.stopPropagation()
            onChange({ ...content, isOpen: !isOpen })
        }

        // Handle child blocks
        // We rely on the parent block's `children` property if we were using a tree structure.
        // BUT, our recursive structure in `types.ts` has `children?: Block[]`.
        // `BlockEditor` expects a flat list of blocks.
        // If we want to use `BlockEditor` inside here, we need to pass `content.children` or similar.
        // However, `useBlockEditor` manages a flat list. 
        // We'll store children in `content.children` for persistence.

        const handleChildrenChange = (newChildren: Block[]) => {
            onChange({ ...content, children: newChildren })
        }

        return (
            <div className="flex flex-col">
                <div className="flex items-start gap-1 py-1 group">
                    <button
                        onClick={toggleOpen}
                        className="mt-1.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 transition-colors select-none"
                        contentEditable={false}
                    >
                        <ChevronRight
                            className={cn(
                                "w-4 h-4 transition-transform",
                                isOpen && "rotate-90"
                            )}
                        />
                    </button>

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
                            !text && "empty:before:content-['Toggle'] empty:before:text-gray-300 empty:before:pointer-events-none"
                        )}
                        tagName="div"
                    />
                </div>

                {isOpen && (
                    <div className="pl-6 ml-2 border-l border-gray-100 dark:border-zinc-800">
                        {/* Recursive Editor */}
                        {/* We pass a simplified callback or manage state effectively */}
                        <BlockEditor
                            initialBlocks={content.children || []}
                            onChange={handleChildrenChange}
                        />
                    </div>
                )}
            </div>
        )
    }
)

ToggleBlock.displayName = 'ToggleBlock'
