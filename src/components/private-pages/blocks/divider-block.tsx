'use client'

import React from 'react'
import { Block, BlockType } from '../types'

interface DividerBlockProps {
    block: Block
    onUpdate: (content: Record<string, unknown>) => void
    onDelete: () => void
    onAddBlock: (type: BlockType, afterBlockId: string) => void
    isEditing?: boolean
}

export function DividerBlock({ onDelete }: DividerBlockProps) {
    return (
        <div
            className="py-3 group cursor-pointer"
            onClick={onDelete}
            title="Click to delete"
        >
            <hr className="border-border group-hover:border-muted-foreground/50 transition-colors" />
        </div>
    )
}
