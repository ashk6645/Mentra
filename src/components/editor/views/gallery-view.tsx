import React from 'react'
import { Plus, ImageIcon, Trash2 } from 'lucide-react'
import { DatabaseItem } from './mock-data'

interface GalleryViewProps {
    items: DatabaseItem[]
    onUpdateItem: (id: string, updates: Partial<DatabaseItem>) => void
    onAddItem: () => void
    onDeleteItem: (id: string) => void
}

export function GalleryView({ items, onUpdateItem, onAddItem, onDeleteItem }: GalleryViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {items.map(item => (
                <div key={item.id} className="group bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all overflow-hidden cursor-pointer relative">
                    {/* Delete Button (Hover) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDeleteItem(item.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 hover:bg-red-50 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Cover Area */}
                    <div className="h-32 bg-gray-100 dark:bg-zinc-900 w-full relative">
                        {item.cover ? (
                            <img
                                src={item.cover}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-300">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                        <input
                            className="font-medium text-gray-900 dark:text-gray-100 mb-2 truncate bg-transparent outline-none w-full"
                            value={item.title}
                            placeholder="Untitled"
                            onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {item.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-900 rounded text-[10px] text-gray-600 dark:text-gray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* If no tags, show status as fallback tag */}
                        {(!item.tags || item.tags.length === 0) && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-900 rounded text-[10px] text-gray-500">
                                {item.status}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            {/* New Item */}
            <button
                onClick={onAddItem}
                className="flex flex-col items-center justify-center gap-2 h-full min-h-[180px] border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-gray-400"
            >
                <Plus className="w-6 h-6" />
                <span className="text-sm">New</span>
            </button>
        </div>
    )
}
