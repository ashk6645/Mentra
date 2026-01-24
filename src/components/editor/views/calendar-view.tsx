import React from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DatabaseItem } from './mock-data'

// Simple Calendar Mock Helpers
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DATES = Array.from({ length: 35 }, (_, i) => i + 1) // Simple 1-35 for visual grid

interface CalendarViewProps {
    items: DatabaseItem[]
    onUpdateItem: (id: string, updates: Partial<DatabaseItem>) => void
    onAddItem: () => void
    onDeleteItem: (id: string) => void
}

export function CalendarView({ items, onUpdateItem, onAddItem }: CalendarViewProps) {
    // In a real app, we would map dates to grid cells.
    // For now, we'll arbitrarily place items or try to match if `date` string matches.

    // Helper to check if item falls on this "mock date"
    const getItemsForDate = (dayNum: number) => {
        // Mock logic: randomly or hash-mapped for visuals if date parsing is complex
        // But let's try basic matching if date string contains day number
        return items.filter(item => {
            if (!item.date) return false
            // Very naive check: does "Oct 24" contain "24"?
            // We assume DATES 1-31 correspond to current month days.
            if (dayNum > 31) return false
            return item.date.includes(` ${dayNum},`) || item.date.includes(` ${dayNum} `)
            // Fallback for demo: just show item 1 on day 24 if it matches
        })
    }

    return (
        <div className="w-full border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                <div className="font-medium">Current Month</div>
                <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded">
                        <span className="text-xs font-medium">Today</span>
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                {DAYS.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-zinc-800 last:border-0">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[100px]">
                {DATES.map((date, i) => {
                    const isCurrentMonth = date <= 31
                    const dayItems = isCurrentMonth ? getItemsForDate(date) : []

                    return (
                        <div key={i}
                            className={`p-2 border-b border-r border-gray-200 dark:border-zinc-800 ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-zinc-900/50 text-gray-300' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50 group'} relative cursor-pointer`}
                            onClick={() => {
                                if (isCurrentMonth) {
                                    // Ideally open modal to add item on this date
                                    // onAddItem() just adds to end now, but could accept date prepopulation
                                    onAddItem()
                                }
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-xs text-gray-500 mb-1">{isCurrentMonth ? date : date - 31}</div>
                                {isCurrentMonth && (
                                    <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded">
                                        <Plus className="w-3 h-3 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                {dayItems.map(item => (
                                    <div key={item.id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded truncate cursor-context-menu"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            // Open item edit
                                        }}
                                    >
                                        {item.title || 'Untitled'}
                                    </div>
                                ))}
                                {/* Show manual items for demo matching image if not dynamic */}
                                {isCurrentMonth && date === 24 && !dayItems.find(i => i.date?.includes('24')) && (
                                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded truncate opacity-50">
                                        Team Meeting
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
