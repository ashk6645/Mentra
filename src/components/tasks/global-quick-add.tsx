'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { Zap, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalQuickAddProps {
    className?: string
}

export function GlobalQuickAdd({ className }: GlobalQuickAddProps) {
    const [open, setOpen] = useState(false)

    // Global keyboard shortcut: Cmd/Ctrl + Shift + A
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
                e.preventDefault()
                setOpen(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <CreateTaskDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button
                    onClick={() => setOpen(true)}
                    className={cn(
                        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50',
                        'bg-primary hover:bg-primary/90',
                        className
                    )}
                    size="icon"
                    title="Quick Add Task (Cmd/Ctrl + Shift + A)"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            }
        />
    )
}
