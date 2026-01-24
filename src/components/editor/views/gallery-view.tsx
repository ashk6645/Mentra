import React from 'react'
import { Block } from '../types'
import { Plus, MoreHorizontal, ImageIcon } from 'lucide-react'

// Mock Data Types for UI Prototyping
import { SHARED_DATABASE_ITEMS } from './mock-data'

interface GalleryViewProps {
    block: Block
}

export function GalleryView({ block }: GalleryViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {SHARED_DATABASE_ITEMS.map(item => (
                <div key={item.id} className="group bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all overflow-hidden cursor-pointer">
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
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 truncate">
                            {item.title}
                        </div>
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {item.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-900 rounded text-[10px] text-gray-600 dark:text-gray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* New Item */}
            <button className="flex flex-col items-center justify-center gap-2 h-full min-h-[180px] border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-gray-400">
                <Plus className="w-6 h-6" />
                <span className="text-sm">New</span>
            </button>
        </div>
    )
}
