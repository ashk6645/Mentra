import React from 'react'
import { Block } from '../types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Simple Calendar Mock
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DATES = Array.from({ length: 35 }, (_, i) => i + 1) // Simple 1-35 for visual grid

interface CalendarViewProps {
    block: Block
}

export function CalendarView({ block }: CalendarViewProps) {
    return (
        <div className="w-full border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                <div className="font-medium">October 2024</div>
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
                    return (
                        <div key={i} className={`p-2 border-b border-r border-gray-200 dark:border-zinc-800 ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-zinc-900/50 text-gray-300' : ''}`}>
                            <div className="text-xs text-gray-500 mb-1">{isCurrentMonth ? date : date - 31}</div>
                            {date === 15 && (
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded truncate">
                                    Project Deadline
                                </div>
                            )}
                            {date === 24 && (
                                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded truncate">
                                    Team Meeting
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
