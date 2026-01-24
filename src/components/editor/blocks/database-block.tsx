import React, { useState } from 'react'
import { Block } from '../types'
import { BoardView } from '../views/board-view'
import { TableView } from '../views/table-view'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs' // Assuming we have these or need to make them
import { KanbanSquare, Table as TableIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatabaseBlockProps {
    block: Block
    isFocused: boolean
    updateBlock: (id: string, updates: Partial<Block>) => void
}

export function DatabaseBlock({ block, isFocused, updateBlock }: DatabaseBlockProps) {
    // For MVP, we default to Board View if type is DATABASE_BOARD
    // But strictly speaking, a database block could toggle views.
    // We'll stick to what the block.type says for the primary rendering, 
    // but show controls to switch.

    const [activeView, setActiveView] = useState<'board' | 'table'>('board')

    return (
        <div className="flex flex-col space-y-4 my-4 w-full border rounded-md p-4 bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        {block.content.title || "Untitled Database"}
                    </h3>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-md">
                    <button
                        onClick={() => setActiveView('board')}
                        className={cn("p-1.5 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors", activeView === 'board' && "bg-white dark:bg-zinc-700 shadow-sm")}
                    >
                        <KanbanSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setActiveView('table')}
                        className={cn("p-1.5 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors", activeView === 'table' && "bg-white dark:bg-zinc-700 shadow-sm")}
                    >
                        <TableIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="min-h-[300px]">
                {activeView === 'board' && <BoardView block={block} />}
                {activeView === 'table' && <TableView block={block} />}
            </div>
        </div>
    )
}
