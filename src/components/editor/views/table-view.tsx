import React from 'react'
import { Plus, FileText, Calendar, Hash, Tag, Trash2, MoreHorizontal } from 'lucide-react'
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
    onOpenItem: (id: string) => void
}

export function TableView({ items, onUpdateItem, onAddItem, onDeleteItem, onOpenItem }: TableViewProps) {
    return (
        <div className="w-full overflow-x-auto border-t border-border/20">
            <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border/20 text-muted-foreground/80">
                        <th className="w-[300px] py-1.5 px-3 text-left font-normal border-r border-border/20 hover:bg-accent/20 cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-xs">Name</span>
                            </div>
                        </th>
                        <th className="w-[150px] py-1.5 px-3 text-left font-normal border-r border-border/20 hover:bg-accent/20 cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5" />
                                <span className="text-xs">Status</span>
                            </div>
                        </th>
                        <th className="w-[150px] py-1.5 px-3 text-left font-normal border-r border-border/20 hover:bg-accent/20 cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5" />
                                <span className="text-xs">Priority</span>
                            </div>
                        </th>
                        <th className="py-1.5 px-3 text-left font-normal hover:bg-accent/20 cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-xs">Date</span>
                            </div>
                        </th>
                        <th className="w-[40px] py-1.5 px-3"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr
                            key={item.id}
                            className="group hover:bg-muted/30 border-b border-border/20 last:border-0 transition-colors"
                        >
                            <td className="py-1.5 px-3 border-r border-border/20 cursor-pointer" onClick={() => onOpenItem(item.id)}>
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{item.icon || "📄"}</span>
                                    <span className="font-medium text-foreground truncate block w-full">
                                        {item.title || "Untitled"}
                                    </span>
                                </div>
                            </td>
                            <td className="py-1.5 px-3 border-r border-border/20">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm text-xs cursor-pointer hover:opacity-80 block w-fit truncate",
                                            item.status === 'Not started' && "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300",
                                            item.status === 'In progress' && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                            item.status === 'Done' && "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
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
                            <td className="py-1.5 px-3 border-r border-border/20">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm text-xs cursor-pointer hover:opacity-80 block w-fit",
                                            (!item.priority || item.priority === 'Low') && "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300",
                                            item.priority === 'High' && "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                            item.priority === 'Medium' && "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                        )}>
                                            {item.priority || 'Low'}
                                        </span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => onUpdateItem(item.id, { priority: 'High' })}>
                                            <span className="text-orange-500 bg-orange-50 px-1 rounded text-xs mr-2">High</span>
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
                            <td className="py-1.5 px-3 text-muted-foreground text-xs">
                                {item.date || <span className="text-muted-foreground/30">No date</span>}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                                <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={5} className="py-1.5 px-3 text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors border-t border-transparent"
                            onClick={onAddItem}
                        >
                            <div className="flex items-center gap-2 py-1">
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">New</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
