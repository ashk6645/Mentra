'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createTaskFromNaturalLanguage } from '@/lib/actions/tasks'
import { showErrorToast } from '@/lib/error-handler'
import { cn } from '@/lib/utils'

interface InlineTaskInputProps {
    onTaskCreated?: (taskId: string) => void
    availableProjects?: any[]
    availableTags?: any[]
}

export function InlineTaskInput({ onTaskCreated }: InlineTaskInputProps) {
    const [value, setValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!value.trim()) return

        setIsSubmitting(true)
        try {
            const result = await createTaskFromNaturalLanguage(value)
            if (result.success && result.data) {
                setValue('')
                onTaskCreated?.(result.data.id)
            } else {
                showErrorToast(result.error || 'Failed to create task', 'Create Task')
            }
        } catch (error) {
            console.error('Failed to create task inline:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="flex items-center gap-3 p-3 mt-2 rounded-lg border border-transparent hover:bg-muted/30 focus-within:bg-muted/30 focus-within:border-primary/20 transition-all group">
            <div className="flex items-center justify-center shrink-0">
                <div className={cn(
                    "h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center transition-colors",
                    "group-focus-within:border-primary/50 group-focus-within:bg-primary/10"
                )}>
                    <Plus className={cn(
                        "h-3 w-3 text-muted-foreground/50 transition-colors",
                        "group-focus-within:text-primary"
                    )} />
                </div>
            </div>

            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a task..."
                className="flex-1 border-none shadow-none bg-transparent px-0 h-auto py-1 focus-visible:ring-0 placeholder:text-muted-foreground/70"
                disabled={isSubmitting}
            />

            {value.trim() && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    Enter
                </Button>
            )}
        </div>
    )
}
