'use client'

import React from 'react'
import { Block, BlockType } from './types'
import { TextBlock } from './blocks/text-block'
import { HeadingBlock } from './blocks/heading-block'
import { DividerBlock } from './blocks/divider-block'
import { CalloutBlock } from './blocks/callout-block'
import { QuoteBlock } from './blocks/quote-block'
import { CodeBlock } from './blocks/code-block'
import { ListBlock } from './blocks/list-block'
import { ImageBlock } from './blocks/image-block'
import { VideoBlock } from './blocks/video-block'
import { ToggleBlock } from './blocks/toggle-block'
import { DatabaseBlock } from './blocks/database-block'

// ========================================
// BLOCK RENDERER
// Routes each block type to its component
// ========================================

interface BlockRendererProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    onOpenSlashMenu: () => void
    isEditing?: boolean
}

export function BlockRenderer({
    block,
    onUpdate,
    onDelete,
    onAddBlock,
    onOpenSlashMenu,
    isEditing = false,
}: BlockRendererProps) {
    const commonProps = {
        block,
        onUpdate,
        onDelete,
        onAddBlock,
        onOpenSlashMenu,
        isEditing,
    }

    switch (block.type) {
        // Text blocks
        case 'TEXT':
            return <TextBlock {...commonProps} />

        // Heading blocks
        case 'HEADING_1':
            return <HeadingBlock {...commonProps} level={1} />
        case 'HEADING_2':
            return <HeadingBlock {...commonProps} level={2} />
        case 'HEADING_3':
            return <HeadingBlock {...commonProps} level={3} />

        // Divider
        case 'DIVIDER':
            return <DividerBlock {...commonProps} />

        // List blocks
        case 'BULLETED_LIST':
            return <ListBlock {...commonProps} variant="bulleted" />
        case 'NUMBERED_LIST':
            return <ListBlock {...commonProps} variant="numbered" />
        case 'TODO_LIST':
            return <ListBlock {...commonProps} variant="todo" />

        // Content blocks
        case 'CALLOUT':
            return <CalloutBlock {...commonProps} />
        case 'QUOTE':
            return <QuoteBlock {...commonProps} />
        case 'CODE':
            return <CodeBlock {...commonProps} />

        // Toggle blocks
        case 'TOGGLE_HEADING_1':
        case 'TOGGLE_HEADING_2':
        case 'TOGGLE_HEADING_3':
        case 'TOGGLE_LIST':
            return <ToggleBlock {...commonProps} />

        // Media blocks
        case 'IMAGE':
            return <ImageBlock {...commonProps} />
        case 'VIDEO':
            return <VideoBlock {...commonProps} />
        case 'FILE':
            return (
                <div className="py-4 px-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                    File upload - coming soon
                </div>
            )

        // Database blocks
        case 'DATABASE_TABLE':
            return <DatabaseBlock {...commonProps} viewType="TABLE" />
        case 'DATABASE_BOARD':
            return <DatabaseBlock {...commonProps} viewType="BOARD" />
        case 'DATABASE_GALLERY':
            return <DatabaseBlock {...commonProps} viewType="GALLERY" />
        case 'DATABASE_LIST':
            return <DatabaseBlock {...commonProps} viewType="LIST" />
        case 'DATABASE_CALENDAR':
            return <DatabaseBlock {...commonProps} viewType="CALENDAR" />
        case 'DATABASE_CHART':
            return <DatabaseBlock {...commonProps} viewType="CHART" />

        default:
            return (
                <div className="py-2 px-3 text-muted-foreground text-sm">
                    Unknown block type: {block.type}
                </div>
            )
    }
}

