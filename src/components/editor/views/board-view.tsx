import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatabaseItem } from './mock-data'

const COLUMNS = [
    {
        id: 'Not started',
        label: 'Not started',
        bg: 'bg-gray-50/80 dark:bg-zinc-900/50',
        headerColor: 'bg-gray-200/50 text-gray-700 dark:bg-zinc-800 dark:text-gray-400'
    },
    {
        id: 'In progress',
        label: 'In progress',
        bg: 'bg-blue-50/50 dark:bg-blue-900/10',
        headerColor: 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
        id: 'Done',
        label: 'Done',
        bg: 'bg-green-50/50 dark:bg-green-900/10',
        headerColor: 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
]

interface BoardViewProps {
    items: DatabaseItem[]
    onUpdateItem: (id: string, updates: Partial<DatabaseItem>) => void
    onAddItem: (columnId: string) => void
    onDeleteItem: (id: string) => void
    onOpenItem: (id: string) => void
}

export function BoardView({ items, onUpdateItem, onAddItem, onDeleteItem, onOpenItem }: BoardViewProps) {
    return (
        <div className="grid grid-cols-3 gap-4 h-full pb-4 items-start">
            {COLUMNS.map(col => {
                const colItems = items.filter(i => i.status === col.id)

                return (
                    <div key={col.id} className={cn("flex flex-col h-full rounded-lg p-2 transition-colors", col.bg)}>
                        {/* Column Header */}
                        <div className="flex items-center gap-2 mb-3 px-1 pt-1">
                            <span className={cn("px-2 py-0.5 rounded-sm text-xs font-semibold select-none", col.headerColor)}>
                                {col.label}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">{colItems.length}</span>
                        </div>

                        {/* Column Content */}
                        <div className="space-y-2 flex-1 overflow-y-auto min-h-[100px]">
                            {colItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => onOpenItem(item.id)}
                                    className="group bg-white dark:bg-zinc-900 p-3 rounded-md shadow-sm border border-border/20 hover:border-border/40 hover:shadow-md transition-all cursor-pointer select-none relative"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5 text-base sm:text-lg opacity-80 select-none">{item.icon || "📄"}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-foreground leading-snug truncate">
                                                {item.title || "Untitled"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* New Item Button */}
                            <button
                                onClick={() => onAddItem(col.id)}
                                className="flex items-center gap-2 text-muted-foreground/70 hover:text-foreground px-2 py-2 text-sm w-full text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors mt-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New page</span>
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
