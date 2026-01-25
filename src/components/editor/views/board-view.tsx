import React from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatabaseItem } from './mock-data'

const COLUMNS = [
    { id: 'Not started', label: 'Not started', color: 'bg-gray-100 text-gray-700' },
    { id: 'In progress', label: 'In progress', color: 'bg-blue-50 text-blue-700' },
    { id: 'Done', label: 'Done', color: 'bg-green-50 text-green-700' }
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
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {COLUMNS.map(col => {
                const colItems = items.filter(i => i.status === col.id)

                return (
                    <div key={col.id} className="flex-none w-[260px] flex flex-col h-full">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", col.color)}>
                                    {colItems.length}
                                </span>
                                <span className="text-sm font-medium text-foreground">{col.label}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onAddItem(col.id)} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="space-y-2">
                            {colItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => onOpenItem(item.id)}
                                    className="group bg-background p-3 rounded-md shadow-sm border border-border/40 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="mt-0.5">📄</div>
                                        <div className="font-medium text-sm text-foreground leading-snug">
                                            {item.title || "Untitled"}
                                        </div>
                                    </div>

                                    {/* Footer Metadata */}
                                    {(item.priority || item.date) && (
                                        <div className="flex items-center gap-2 mt-2">
                                            {item.priority && (
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded border bg-muted/30 text-muted-foreground",
                                                )}>
                                                    {item.priority}
                                                </span>
                                            )}
                                            {item.date && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {item.date}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* New Item Button */}
                            <button
                                onClick={() => onAddItem(col.id)}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-2 py-1.5 text-sm w-full text-left hover:bg-accent rounded-md transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New</span>
                            </button>
                        </div>
                    </div>
                )
            })}
            {/* New Group Button */}
            <div className="flex-none w-[200px] pt-1 opacity-60 hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 text-sm w-full text-left rounded-md hover:bg-accent">
                    <Plus className="w-4 h-4" />
                    <span>Add group</span>
                </button>
            </div>
        </div>
    )
}
