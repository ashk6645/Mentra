'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QuickAddInput } from './quick-add-input'
import { createTaskFromNaturalLanguage } from '@/lib/actions/tasks'
import { getTags } from '@/lib/actions/tags'
import { Tag } from '@prisma/client'
import { ParsedTaskData } from '@/lib/parsers/task-parser'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalQuickAddProps {
    className?: string
}

export function GlobalQuickAdd({ className }: GlobalQuickAddProps) {
    const [open, setOpen] = useState(false)

    const [tags, setTags] = useState<Tag[]>([])
    const router = useRouter()

    // Fetch projects and tags when dialog opens
    useEffect(() => {
        if (open) {
            getTags().then(setTags)
        }
    }, [open])

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

    const handleSubmit = async (parsedData: ParsedTaskData) => {
        const result = await createTaskFromNaturalLanguage(parsedData.rawInput)
        if (result.success) {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <>
            {/* Floating Action Button */}
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
                <Zap className="h-6 w-6" />
            </Button>

            {/* Quick Add Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="sm:max-w-[550px]"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Quick Add Task
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Cmd</kbd> +{' '}
                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Shift</kbd> +{' '}
                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">A</kbd> anytime
                        </p>
                    </DialogHeader>

                    <QuickAddInput
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                        availableTags={tags}
                        autoFocus
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
