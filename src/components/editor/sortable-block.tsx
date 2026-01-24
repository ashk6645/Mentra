import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BlockRenderer } from './block-renderer'
import { Block } from './types'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface SortableBlockProps {
    block: Block
    isFocused: boolean
    updateBlock: (id: string, updates: Partial<Block>) => void
    addBlock: (type: any, content: any, afterId: string) => void
    removeBlock: (id: string) => void
    onFocus: (id: string) => void
    onBlur: (id: string) => void
    onKeyDown: (e: React.KeyboardEvent, blockId: string) => void
}

export function SortableBlock({ block, ...props }: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="group flex items-start relative -ml-8 pl-8">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "absolute left-0 top-1.5 p-0.5 rounded cursor-grab opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-opacity",
                    isDragging && "opacity-100 cursor-grabbing"
                )}
                contentEditable={false} // Important so it doesn't interfere with editor
            >
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex-1 min-w-0">
                <BlockRenderer block={block} {...props} />
            </div>
        </div>
    )
}
