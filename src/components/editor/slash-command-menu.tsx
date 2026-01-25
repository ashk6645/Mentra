import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
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
    CalendarDays,
    ChevronRight,
} from 'lucide-react'

interface CommandItem {
    type: BlockType
    label: string
    description: string
    icon: React.ComponentType<any>
    keywords?: string[]
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
                icon: Type,
                keywords: ['paragraph', 'p']
            },
            {
                type: 'HEADING_1',
                label: 'Heading 1',
                description: 'Big section heading.',
                icon: Heading1,
                keywords: ['h1', 'title', 'big']
            },
            {
                type: 'HEADING_2',
                label: 'Heading 2',
                description: 'Medium section heading.',
                icon: Heading2,
                keywords: ['h2', 'subtitle', 'medium']
            },
            {
                type: 'HEADING_3',
                label: 'Heading 3',
                description: 'Small section heading.',
                icon: Heading3,
                keywords: ['h3', 'small']
            },
            {
                type: 'BULLETED_LIST',
                label: 'Bulleted List',
                description: 'Create a simple bulleted list.',
                icon: List,
                keywords: ['bullet', 'ul', 'unordered']
            },
            {
                type: 'NUMBERED_LIST',
                label: 'Numbered List',
                description: 'Create a list with numbering.',
                icon: ListOrdered,
                keywords: ['number', 'ol', 'ordered', '1.']
            },
            {
                type: 'TODO_LIST',
                label: 'To-do List',
                description: 'Track tasks with a to-do list.',
                icon: CheckSquare,
                keywords: ['todo', 'task', 'checkbox', 'check']
            },
            {
                type: 'QUOTE',
                label: 'Quote',
                description: 'Capture a quote.',
                icon: Quote,
                keywords: ['blockquote', 'citation']
            },
            {
                type: 'CODE',
                label: 'Code',
                description: 'Capture a code snippet.',
                icon: Code,
                keywords: ['snippet', 'codeblock', 'java', 'js', 'ts', 'python', 'cpp']
            },
            {
                type: 'DIVIDER',
                label: 'Divider',
                description: 'Visually divide blocks.',
                icon: Minus,
                keywords: ['line', 'hr', 'separator']
            },
            {
                type: 'TOGGLE_LIST',
                label: 'Toggle List',
                description: 'Toggles can hide and show content inside.',
                icon: ChevronRight,
                keywords: ['accordion', 'collapse', 'expand']
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
                icon: Table,
                keywords: ['db', 'spreadsheet', 'grid']
            },
            {
                type: 'DATABASE_BOARD',
                label: 'Board View',
                description: 'Embed a database board.',
                icon: KanbanSquare,
                keywords: ['kanban', 'cards']
            },
            {
                type: 'DATABASE_GALLERY',
                label: 'Gallery View',
                description: 'Embed a database gallery.',
                icon: LayoutGrid,
                keywords: ['images', 'photos', 'grid']
            },
            {
                type: 'DATABASE_CALENDAR',
                label: 'Calendar View',
                description: 'Embed a database calendar.',
                icon: CalendarDays,
                keywords: ['date', 'schedule']
            },
        ]
    }
]

interface SlashCommandMenuProps {
    position: { top: number; left: number } | null
    onSelect: (type: BlockType) => void
    onClose: () => void
    query: string
    placement?: 'top' | 'bottom'
}

export function SlashCommandMenu({ position, onSelect, onClose, query, placement = 'bottom' }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [mounted, setMounted] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const filteredCategories = COMMAND_CATEGORIES.map(category => ({
        ...category,
        items: category.items.filter(command => {
            const search = query.toLowerCase()
            return (
                command.label.toLowerCase().includes(search) ||
                command.description.toLowerCase().includes(search) ||
                command.keywords?.some(k => k.toLowerCase().includes(search))
            )
        })
    })).filter(category => category.items.length > 0)

    const flatCommands = filteredCategories.flatMap(c => c.items)

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

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

    const MENU_HEIGHT = 320
    const spaceBelow = window.innerHeight - position.top
    const shouldFlip = spaceBelow < MENU_HEIGHT

    const style: React.CSSProperties = {
        left: position.left,
        maxHeight: `${MENU_HEIGHT}px`,
    }

    if (shouldFlip) {
        style.bottom = window.innerHeight - position.top + 24
    } else {
        style.top = position.top + 24
    }

    const content = (
        <div
            ref={menuRef}
            className="fixed z-[9999] w-80 overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-75"
            style={style}
        >
            {flatCommands.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                    No commands match
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {query && filteredCategories.length > 0 && (
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider select-none bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800">
                                Filtered results
                            </div>
                        )}

                        {filteredCategories.map((category) => (
                            <div key={category.label}>
                                {!query && (
                                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider select-none">
                                        {category.label}
                                    </div>
                                )}
                                {category.items.map((command) => {
                                    const itemIndex = flatCommands.indexOf(command);
                                    const isSelected = itemIndex === selectedIndex

                                    return (
                                        <button
                                            key={command.type}
                                            ref={el => {
                                                if (isSelected && el) {
                                                    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 w-full text-left transition-colors mx-1 rounded-md max-w-[calc(100%-8px)]",
                                                isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                                            )}
                                            onClick={() => onSelect(command.type)}
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

                    {query && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 px-3 py-2 text-xs text-gray-400 flex justify-between items-center bg-gray-50/30 dark:bg-zinc-900/30">
                            <span>
                                Type <span className="font-mono text-gray-600 dark:text-gray-300">{'/' + query}</span> on the page
                            </span>
                            <span className="text-[10px] uppercase tracking-wider opacity-60">ESC</span>
                        </div>
                    )}
                </>
            )}
        </div>
    )

    if (!mounted) return null
    return createPortal(content, document.body)
}
