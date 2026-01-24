import React, { useEffect, useState, useRef, useCallback } from 'react'
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
    Image as ImageIcon,
    Table,
    KanbanSquare
} from 'lucide-react'

interface CommandItem {
    type: BlockType
    label: string
    description: string
    icon: React.ComponentType<any>
}

const COMMANDS: CommandItem[] = [
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

    const filteredCommands = COMMANDS.filter(command =>
        command.label.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase())
    )

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
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].type)
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [position, filteredCommands, selectedIndex, onSelect, onClose])

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

    if (filteredCommands.length === 0) {
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

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-72 max-h-[300px] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 flex flex-col p-1"
            style={{ top: position.top, left: position.left }}
        >
            <div className="text-xs font-semibold text-gray-500 px-2 py-1.5 uppercase tracking-wider">
                Basic Blocks
            </div>
            {filteredCommands.map((command, index) => (
                <button
                    key={command.type}
                    className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors",
                        index === selectedIndex ? "bg-gray-100 dark:bg-zinc-800" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    )}
                    onClick={() => onSelect(command.type)}
                >
                    <div className="p-1 rounded border bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800">
                        <command.icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{command.label}</span>
                        <span className="text-xs text-gray-500">{command.description}</span>
                    </div>
                </button>
            ))}
        </div>
    )
}
