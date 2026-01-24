import React from 'react'
import { Plus, FileText, Calendar, Hash, Tag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatabaseItem } from './mock-data'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TableViewProps {
    items: DatabaseItem[]
    onUpdateItem: (id: string, updates: Partial<DatabaseItem>) => void
    onAddItem: () => void
    onDeleteItem: (id: string) => void
}

export function TableView({ items, onUpdateItem, onAddItem, onDeleteItem }: TableViewProps) {
    return (
        <div className="w-full overflow-x-auto border-t border-gray-200 dark:border-zinc-800">
            <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-500">
                        <th className="w-[300px] py-2 px-3 text-left font-normal border-r border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span>Name</span>
                            </div>
                        </th>
                        <th className="w-[150px] py-2 px-3 text-left font-normal border-r border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span>Status</span>
                            </div>
                        </th>
                        <th className="w-[150px] py-2 px-3 text-left font-normal border-r border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-400" />
                                <span>Priority</span>
                            </div>
                        </th>
                        <th className="py-2 px-3 text-left font-normal">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Date</span>
                            </div>
                        </th>
                        <th className="w-[40px] py-2 px-3"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 last:border-0 transition-colors">
                            <td className="py-2 px-3 border-r border-gray-200 dark:border-zinc-800 group-hover:dark:border-zinc-800">
                                <input
                                    className="font-medium bg-transparent outline-none w-full block text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                                    value={item.title}
                                    placeholder="Untitled"
                                    onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                                />
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 dark:border-zinc-800">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm text-xs cursor-pointer hover:opacity-80 block w-fit",
                                            item.status === 'Not started' && "bg-gray-200 text-gray-700",
                                            item.status === 'In progress' && "bg-blue-100 text-blue-700",
                                            item.status === 'Done' && "bg-green-100 text-green-700"
                                        )}>
                                            {item.status}
                                        </span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { status: 'Not started' })}>
                                            <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                                            Not started
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { status: 'In progress' })}>
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                            In progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { status: 'Done' })}>
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                            Done
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 dark:border-zinc-800">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm text-xs cursor-pointer hover:opacity-80 block w-fit",
                                            (!item.priority || item.priority === 'Low') && "bg-gray-100 text-gray-700",
                                            item.priority === 'High' && "bg-red-100 text-red-700",
                                            item.priority === 'Medium' && "bg-yellow-100 text-yellow-700",
                                        )}>
                                            {item.priority || 'Low'}
                                        </span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { priority: 'High' })}>
                                            <span className="text-red-500 bg-red-50 px-1 rounded text-xs mr-2">High</span>
                                            High Priority
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { priority: 'Medium' })}>
                                            <span className="text-yellow-500 bg-yellow-50 px-1 rounded text-xs mr-2">Medium</span>
                                            Medium Priority
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { priority: 'Low' })}>
                                            <span className="text-gray-500 bg-gray-50 px-1 rounded text-xs mr-2">Low</span>
                                            Low Priority
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                            <td className="py-2 px-3 text-gray-500">
                                <input
                                    className="bg-transparent outline-none w-full text-gray-500"
                                    value={item.date || ''}
                                    onChange={(e) => onUpdateItem(item.id, { date: e.target.value })}
                                    placeholder="No date"
                                />
                            </td>
                            <td className="py-2 px-3 text-right">
                                <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={5} className="py-1 px-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors border-t border-transparent"
                            onClick={onAddItem}
                        >
                            <div className="flex items-center gap-2 py-1">
                                <Plus className="w-4 h-4" />
                                <span>New</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
