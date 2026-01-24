import React, { useState } from 'react'
import { Block } from '../types'
import { Plus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatabaseItem } from './mock-data'

const COLUMNS = [
    { id: 'Not started', label: 'Not started', color: 'bg-gray-200 text-gray-700' },
    { id: 'In progress', label: 'In progress', color: 'bg-blue-100 text-blue-700' },
    { id: 'Done', label: 'Done', color: 'bg-green-100 text-green-700' }
]

interface BoardViewProps {
    items: DatabaseItem[]
    onUpdateItem: (id: string, updates: Partial<DatabaseItem>) => void
    onAddItem: (columnId: string) => void
    onDeleteItem: (id: string) => void
}

export function BoardView({ items, onUpdateItem, onAddItem, onDeleteItem }: BoardViewProps) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(col => {
                const colItems = items.filter(i => i.status === col.id)

                return (
                    <div key={col.id} className="flex-1 min-w-[280px]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 rounded-sm text-xs font-medium", col.color)}>
                                    {col.label}
                                </span>
                                <span className="text-gray-400 text-sm">{colItems.length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                                <button onClick={() => onAddItem(col.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                                    <Plus className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {colItems.map(item => (
                                <div key={item.id} className="group bg-white dark:bg-zinc-950 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                                    <input
                                        className="mb-2 font-medium text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none w-full"
                                        value={item.title}
                                        onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                                    />

                                    {/* Progress Bar (if exists, otherwise hidden or optional) */}
                                    {item.progress !== undefined && (
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                <span>{item.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Tag/Priority */}
                                    {item.priority && (
                                        <div className={cn(
                                            "inline-block px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer hover:opacity-80",
                                            item.priority === 'High' && "bg-red-100 text-red-700",
                                            item.priority === 'Medium' && "bg-yellow-100 text-yellow-700",
                                            item.priority === 'Low' && "bg-gray-100 text-gray-700"
                                        )}
                                            onClick={() => {
                                                // Quick priority cycle for now since Board View UI is dense
                                                const next = item.priority === 'Low' ? 'Medium' : item.priority === 'Medium' ? 'High' : 'Low'
                                                onUpdateItem(item.id, { priority: next })
                                            }}
                                        >
                                            {item.priority}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* New Item Button */}
                            <button
                                onClick={() => onAddItem(col.id)}
                                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 px-2 py-1.5 text-sm w-full text-left hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-md transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New project</span>
                            </button>
                        </div>
                    </div>
                )
            })}
            <div className="min-w-[280px] pt-1">
                <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 px-2 py-1.5 text-sm w-full text-left hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-md transition-colors border border-dashed border-gray-200 dark:border-zinc-800">
                    <Plus className="w-4 h-4" />
                    <span>New group</span>
                </button>
            </div>
        </div>
    )
}
