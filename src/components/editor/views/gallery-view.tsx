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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {items.map(item => (
                <div
                    key={item.id}
                    onClick={() => onOpenItem(item.id)}
                    className="group bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-border/20 hover:border-border/40 hover:shadow-md transition-all overflow-hidden cursor-pointer relative flex flex-col h-full"
                >
                    {/* Cover Area */}
                    <div className="h-40 w-full relative shrink-0 bg-gray-50 dark:bg-zinc-800">
                        {item.cover ? (
                            <img
                                src={item.cover}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-700">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                            </div>
                        )}
                        {/* Delete Button (Hover) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(item.id)
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/60 hover:bg-red-50 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col gap-3 flex-1">
                        {/* Title & Icon */}
                        <div className="flex items-start gap-2">
                            <div className="text-xl select-none leading-none mt-0.5">{item.icon || '📄'}</div>
                            <div className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-tight">
                                {item.title || "Untitled"}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-wrap gap-2">
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-medium border items-center inline-flex",
                                item.status === 'Done' && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50",
                                item.status === 'In progress' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
                                item.status === 'Not started' && "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-zinc-700/50"
                            )}>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full mr-1.5",
                                    item.status === 'Done' && "bg-green-500",
                                    item.status === 'In progress' && "bg-blue-500",
                                    item.status === 'Not started' && "bg-gray-400"
                                )} />
                                {item.status}
                            </span>
                        </div>

                        {/* Footer (Date) */}
                        <div className="mt-auto pt-1">
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                {item.date}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* New Item */}
            <button
                onClick={onAddItem}
                className="flex flex-col items-center justify-center gap-2 h-full min-h-[280px] bg-transparent border border-dashed border-border/40 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors text-muted-foreground/60 hover:text-muted-foreground"
            >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">New</span>
            </button>
        </div>
    )
}
