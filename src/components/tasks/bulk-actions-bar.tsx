'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
    X,
    Trash2,
    Calendar as CalendarIcon,
    Flag,
    CheckCircle2,
    Loader2
} from 'lucide-react'

import { useTaskSelectionStore } from '@/stores/use-task-selection-store'
import { bulkUpdateTasks, bulkDeleteTasks } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

export function BulkActionsBar() {
    const { selectedIds, clearSelection } = useTaskSelectionStore()
    const { toast } = useToast()
    const [isPending, setIsPending] = useState(false)

    const count = selectedIds.size
    const ids = Array.from(selectedIds)

    if (count === 0) return null

    const handlePriorityError = () => {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update priority",
        })
    }

    const setPriority = async (priority: 'urgent' | 'high' | 'medium' | 'low') => {
        setIsPending(true)
        try {
            const result = await bulkUpdateTasks(ids, { priority })
            if (result.success) {
                toast({ title: "Updated", description: `Updated priority for ${count} tasks` })
                clearSelection()
            } else {
                handlePriorityError()
            }
        } catch {
            handlePriorityError()
        } finally {
            setIsPending(false)
        }
    }

    const setDueDate = async (date: Date | undefined) => {
        if (!date) return
        setIsPending(true)
        try {
            const result = await bulkUpdateTasks(ids, { dueDate: date.toISOString() })
            if (result.success) {
                toast({ title: "Updated", description: `Updated due date for ${count} tasks` })
                clearSelection()
            }
        } finally {
            setIsPending(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${count} tasks?`)) return
        setIsPending(true)
        try {
            const result = await bulkDeleteTasks(ids)
            if (result.success) {
                toast({ title: "Deleted", description: `Deleted ${count} tasks` })
                clearSelection()
            }
        } finally {
            setIsPending(false)
        }
    }

    return createPortal(
        <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 text-white shadow-2xl rounded-xl p-2 flex items-center gap-2 pointer-events-auto min-w-[320px] max-w-[90vw]"
            >
                <div className="flex items-center gap-3 px-3 border-r border-zinc-700">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-[11px] font-bold">
                        {count}
                    </div>
                    <span className="text-sm font-medium text-zinc-300 hidden sm:inline">Selected</span>
                </div>

                <div className="flex items-center gap-1">
                    {/* Priority */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-zinc-300 hover:text-white hover:bg-zinc-800" disabled={isPending}>
                                <Flag className="mr-2 h-4 w-4" />
                                Priority
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setPriority('urgent')}>Urgent</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPriority('high')}>High</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPriority('medium')}>Medium</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPriority('low')}>Low</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Due Date */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-zinc-300 hover:text-white hover:bg-zinc-800" disabled={isPending}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Date
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                                mode="single"
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Delete */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>

                <div className="ml-auto pl-2 border-l border-zinc-700">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full" onClick={clearSelection}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}
