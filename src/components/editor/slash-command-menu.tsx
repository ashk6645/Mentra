import React, { useEffect, useState, useRef } from 'react'
import { BlockType } from './types'
import { cn } from '@/lib/utils'
import {
    Type,
    List,
    ListOrdered,
    CheckSquare,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    Minus,
    Table,
    KanbanSquare,
    LayoutGrid,
    CalendarDays
} from 'lucide-react'

interface CommandItem {
    type: BlockType
    label: string
    description: string
    icon: React.ComponentType<any>
}

interface CommandCategory {
    label: string
    items: CommandItem[]
}

const COMMAND_CATEGORIES: CommandCategory[] = [
    {
        label: "Basic Blocks",
        items: [
            {
                type: 'TEXT',
                label: 'Text',
                description: 'Just start writing with plain text.',
                icon: Type
            },
            {
                type: 'HEADING_1',
                label: 'Heading 1',
                description: 'Big section heading.',
                icon: Heading1
            },
            {
                type: 'HEADING_2',
                label: 'Heading 2',
                description: 'Medium section heading.',
                icon: Heading2
            },
            {
                type: 'HEADING_3',
                label: 'Heading 3',
                description: 'Small section heading.',
                icon: Heading3
            },
            {
                type: 'BULLETED_LIST',
                label: 'Bulleted List',
                description: 'Create a simple bulleted list.',
                icon: List
            },
            {
                type: 'NUMBERED_LIST',
                label: 'Numbered List',
                description: 'Create a list with numbering.',
                icon: ListOrdered
            },
            {
                type: 'TODO_LIST',
                label: 'To-do List',
                description: 'Track tasks with a to-do list.',
                icon: CheckSquare
            },
            {
                type: 'QUOTE',
                label: 'Quote',
                description: 'Capture a quote.',
                icon: Quote
            },
            {
                type: 'CODE',
                label: 'Code',
                description: 'Capture a code snippet.',
                icon: Code
            },
            {
                type: 'DIVIDER',
                label: 'Divider',
                description: 'Visually divide blocks.',
                icon: Minus
            },
        ]
    },
    {
        label: "Database",
        items: [
            {
                type: 'DATABASE_TABLE',
                label: 'Table View',
                description: 'Embed a database table.',
                icon: Table
            },
            {
                type: 'DATABASE_BOARD',
                label: 'Board View',
                description: 'Embed a database board.',
                icon: KanbanSquare
            },
            {
                type: 'DATABASE_GALLERY',
                label: 'Gallery View',
                description: 'Embed a database gallery.',
                icon: LayoutGrid
            },
            {
                type: 'DATABASE_CALENDAR',
                label: 'Calendar View',
                description: 'Embed a database calendar.',
                icon: CalendarDays
            },
        ]
    }
]

interface SlashCommandMenuProps {
    position: { top: number; left: number } | null
    onSelect: (type: BlockType) => void
    onClose: () => void
    query: string
}

export function SlashCommandMenu({ position, onSelect, onClose, query }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)

    // Flatten commands for indexing while keeping category structure for rendering
    const filteredCategories = COMMAND_CATEGORIES.map(category => ({
        ...category,
        items: category.items.filter(command =>
            command.label.toLowerCase().includes(query.toLowerCase()) ||
            command.description.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(category => category.items.length > 0)

    const flatCommands = filteredCategories.flatMap(c => c.items)

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!position) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % flatCommands.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + flatCommands.length) % flatCommands.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (flatCommands[selectedIndex]) {
                    onSelect(flatCommands[selectedIndex].type)
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [position, flatCommands, selectedIndex, onSelect, onClose])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    if (!position) return null

    if (flatCommands.length === 0) {
        return (
            <div
                ref={menuRef}
                className="fixed z-50 w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
                style={{ top: position.top, left: position.left }}
            >
                <div className="p-3 text-sm text-gray-500 text-center">
                    No commands match
                </div>
            </div>
        )
    }

    let currentIndex = 0

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col py-1"
            style={{ top: position.top, left: position.left }}
        >
            {filteredCategories.map((category) => (
                <div key={category.label}>
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider select-none">
                        {category.label}
                    </div>
                    {category.items.map((command) => {
                        const isSelected = currentIndex === selectedIndex
                        currentIndex++

                        return (
                            <button
                                key={command.type}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 w-full text-left transition-colors mx-1 rounded-md max-w-[calc(100%-8px)]",
                                    isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                                )}
                                onClick={() => onSelect(command.type)}
                                onMouseEnter={() => setSelectedIndex(currentIndex - 1)} // Optional: hover selects
                            >
                                <div className="w-10 h-10 flex items-center justify-center rounded border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 shrink-0 shadow-sm">
                                    <command.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{command.label}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{command.description}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
