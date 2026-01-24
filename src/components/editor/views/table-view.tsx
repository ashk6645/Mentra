import React from 'react'
import { Block } from '../types'
import { Plus, MoreHorizontal, FileText, Calendar, Hash, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableItem {
    id: string
    title: string
    status: 'Not started' | 'In progress' | 'Done'
    priority?: 'High' | 'Medium' | 'Low'
    date?: string
}

const INITIAL_ITEMS: TableItem[] = [
    { id: '1', title: 'Quarterly sales planning', status: 'Not started', priority: 'Medium', date: 'Oct 24, 2024' },
    { id: '2', title: 'Public launch of iOS app', status: 'In progress', priority: 'High', date: 'Nov 12, 2024' },
    { id: '3', title: 'Revamp new hire onboarding', status: 'Done', priority: 'Low', date: 'Dec 1, 2024' },
]

interface TableViewProps {
    block: Block
}

export function TableView({ block }: TableViewProps) {
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
                    </tr>
                </thead>
                <tbody>
                    {INITIAL_ITEMS.map((item) => (
                        <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 last:border-0">
                            <td className="py-2 px-3 border-r border-gray-200 dark:border-zinc-800 group-hover:dark:border-zinc-800">
                                <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
                                    {item.title}
                                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded text-gray-400 text-xs">
                                        Open
                                    </button>
                                </div>
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 dark:border-zinc-800">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-sm text-xs",
                                    item.status === 'Not started' && "bg-gray-200 text-gray-700",
                                    item.status === 'In progress' && "bg-blue-100 text-blue-700",
                                    item.status === 'Done' && "bg-green-100 text-green-700"
                                )}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 dark:border-zinc-800">
                                {item.priority && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-sm text-xs",
                                        item.priority === 'High' && "bg-red-100 text-red-700",
                                        item.priority === 'Medium' && "bg-yellow-100 text-yellow-700",
                                        item.priority === 'Low' && "bg-gray-100 text-gray-700"
                                    )}>
                                        {item.priority}
                                    </span>
                                )}
                            </td>
                            <td className="py-2 px-3 text-gray-500">
                                {item.date}
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={4} className="py-2 px-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
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
