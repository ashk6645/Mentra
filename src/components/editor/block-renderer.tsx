import React, { useCallback, useRef, useEffect } from 'react'
import { Block, BlockType } from './types'
import { cn } from '@/lib/utils'

// Registry of block components (will be populated as we create them)
import { ParagraphBlock } from './blocks/paragraph-block'

import { DatabaseBlock } from './blocks/database-block'
import { HeadingBlock } from './blocks/heading-block'
import { ListBlock } from './blocks/list-block'
import { TodoBlock } from './blocks/todo-block'
import { DividerBlock } from './blocks/divider-block'
import { CodeBlock } from './blocks/code-block'
import { ToggleBlock } from './blocks/toggle-block'
import { QuoteBlock } from './blocks/quote-block'

// Map block types to components
const BLOCK_COMPONENTS: Partial<Record<BlockType, React.ComponentType<any>>> = {
    TEXT: ParagraphBlock,
    HEADING_1: HeadingBlock,
    HEADING_2: HeadingBlock,
    HEADING_3: HeadingBlock,
    BULLETED_LIST: ListBlock,
    NUMBERED_LIST: ListBlock,
    TODO_LIST: TodoBlock,
    DIVIDER: DividerBlock,
    CODE: CodeBlock,
    TOGGLE_LIST: ToggleBlock,
    QUOTE: QuoteBlock,
    DATABASE_BOARD: DatabaseBlock,
    DATABASE_TABLE: DatabaseBlock,
    DATABASE_GALLERY: DatabaseBlock,
    DATABASE_CALENDAR: DatabaseBlock,
}

interface BlockRendererProps {
    block: Block
    isFocused: boolean
    updateBlock: (id: string, updates: Partial<Block>) => void
    addBlock: (type: any, content: any, afterId: string) => void
    removeBlock: (id: string) => void
    onFocus: (id: string) => void
    onBlur: (id: string) => void
    onKeyDown: (e: React.KeyboardEvent, blockId: string) => void
    numberedListIndex?: number
    cursorOffset?: number | null
}

export function BlockRenderer({
    block,
    isFocused,
    updateBlock,
    addBlock,
    removeBlock,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
}: BlockRendererProps) {
    const Component = BLOCK_COMPONENTS[block.type] || BLOCK_COMPONENTS['TEXT']
    const contentRef = useRef<any>(null)

    // Handle focus effect
    useEffect(() => {
        if (isFocused && contentRef.current) {
            // We might need a more sophisticated focus handling depending on the block type
            // For text blocks, we might want to set cursor to end or specific position
            contentRef.current.focus?.()
        }
    }, [isFocused])

    const handleChange = useCallback((content: any) => {
        updateBlock(block.id, { content })
    }, [block.id, updateBlock])

    if (!Component) {
        return <div className="p-4 text-red-500">Unknown block type: {block.type}</div>
    }

    const isDatabase = ['DATABASE_TABLE', 'DATABASE_BOARD', 'DATABASE_GALLERY', 'DATABASE_CALENDAR'].includes(block.type)

    return (
        <div
            className={cn(
                "group relative flex items-start -ml-2 pl-2 rounded-md transition-colors",

            )}
            data-block-id={block.id}
        >
            {/* Drag Handle / Menu Trigger could go here */}
            <div className="flex-1 min-w-0">
                <Component
                    ref={contentRef}
                    block={block}
                    content={block.content}
                    onChange={handleChange}
                    onKeyDown={(e: React.KeyboardEvent) => onKeyDown(e, block.id)}
                    onFocus={() => onFocus(block.id)}
                    onBlur={() => onBlur(block.id)}
                    numberedListIndex={props.numberedListIndex}
                    cursorOffset={props.cursorOffset}
                />
            </div>
        </div>
    )
}
