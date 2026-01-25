import React from 'react'
import { Plus, ImageIcon, Trash2 } from 'lucide-react'
import { DatabaseItem } from './mock-data'
import { cn } from '@/lib/utils'

interface GalleryViewProps {
    items: DatabaseItem[]
    onUpdateItem: (id: string, updates: Partial<DatabaseItem>) => void
    onAddItem: () => void
    onDeleteItem: (id: string) => void
    onOpenItem: (id: string) => void
}

export function GalleryView({ items, onUpdateItem, onAddItem, onDeleteItem, onOpenItem }: GalleryViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {items.map(item => (
                <div
                    key={item.id}
                    onClick={() => onOpenItem(item.id)}
                    className="group bg-background rounded-md shadow-sm border border-border/40 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all overflow-hidden cursor-pointer relative flex flex-col"
                >
                    {/* Cover Area */}
                    <div className="h-32 bg-muted w-full relative shrink-0">
                        {item.cover ? (
                            <img
                                src={item.cover}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            // Notion-style: if no cover, maybe show content preview or just nothing?
                            // For now, consistent empty state or nothing.
                            // Let's show nothing if no cover, just a small banner or consistent height? 
                            // Actually Notion gallery cards showing content are cool.
                            // But for simplicity, let's keep the consistent height for the "Card" look.
                            <div className="w-full h-full bg-accent/20" />
                        )}
                        {/* Delete Button (Hover) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(item.id)
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-destructive/10 hover:text-destructive rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                        {/* Icon + Title */}
                        <div className="flex items-start gap-2">
                            <div className="text-lg select-none">📄</div>
                            <div className="font-medium text-sm text-foreground line-clamp-2 leading-relaxed flex-1">
                                {item.title || <span className="text-muted-foreground italic">Untitled</span>}
                            </div>
                        </div>

                        {/* Metadata / Tags */}
                        <div className="mt-auto space-y-2">
                            {/* Tags or Status */}
                            <div className="flex flex-wrap gap-1">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] border",
                                    item.status === 'Done' && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
                                    item.status === 'In progress' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                                    item.status === 'Not started' && "bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700"
                                )}>
                                    {item.status}
                                </span>
                                {item.priority && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] border border-border bg-muted/50 text-muted-foreground">
                                        {item.priority}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* New Item */}
            <button
                onClick={onAddItem}
                className="flex flex-col items-center justify-center gap-2 h-full min-h-[180px] bg-transparent border border-dashed border-border/60 rounded-md hover:bg-accent/50 transition-colors text-muted-foreground/50 hover:text-muted-foreground"
            >
                <Plus className="w-6 h-6" />
                <span className="text-sm">New</span>
            </button>
        </div>
    )
}
