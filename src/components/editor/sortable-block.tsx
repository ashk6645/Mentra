import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BlockRenderer } from './block-renderer'
import { Block } from './types'
import { cn } from '@/lib/utils'
import { GripVertical, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SortableBlockProps {
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

export function SortableBlock({ block, removeBlock, ...props }: SortableBlockProps) {
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
            {/* Gutter Actions */}
            <div
                className={cn(
                    "absolute left-0 top-1.5 flex items-center justify-center w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity",
                    isDragging && "opacity-100"
                )}
                contentEditable={false}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div
                            {...attributes}
                            {...listeners}
                            className={cn(
                                "p-0.5 rounded cursor-grab hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 focus:outline-none",
                                isDragging && "cursor-grabbing bg-gray-200 dark:bg-zinc-800"
                            )}
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                removeBlock(block.id)
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 min-w-0">
                <BlockRenderer
                    block={block}
                    removeBlock={removeBlock}
                    {...props}
                />
            </div>
        </div>
    )
}

