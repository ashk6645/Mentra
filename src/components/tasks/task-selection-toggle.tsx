'use client'

import { Button } from '@/components/ui/button'
import { useTaskSelectionStore } from '@/stores/use-task-selection-store'
import { CheckSquare, X } from 'lucide-react'

interface TaskSelectionToggleProps {
    taskIds: string[]
}

export function TaskSelectionToggle({ taskIds }: TaskSelectionToggleProps) {
    const {
        isSelectionMode,
        setIsSelectionMode,
        selectedCount,
        selectAll,
        clearSelection
    } = useTaskSelectionStore()

    const handleToggle = () => {
        if (isSelectionMode) {
            // Exit selection mode
            clearSelection()
        } else {
            // Enter selection mode
            setIsSelectionMode(true)
        }
    }

    const handleSelectAll = () => {
        if (selectedCount() === taskIds.length) {
            clearSelection()
            // Keep selection mode active though
            setIsSelectionMode(true)
        } else {
            selectAll(taskIds)
        }
    }

    if (!isSelectionMode) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="text-muted-foreground hover:text-foreground"
            >
                Select
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-primary hover:text-primary/80 font-medium"
            >
                {selectedCount() === taskIds.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel selection</span>
            </Button>
        </div>
    )
}
