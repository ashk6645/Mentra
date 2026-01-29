'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ParsedElementChip } from './parsed-element-chip'
import { parseTaskNaturalLanguage, ParsedTaskData } from '@/lib/parsers/task-parser'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tag } from '@prisma/client'

interface QuickAddInputProps {
    onSubmit: (parsedData: ParsedTaskData) => void | Promise<void>
    onCancel?: () => void

    availableTags?: Tag[]
    placeholder?: string
    autoFocus?: boolean
    className?: string
}

export function QuickAddInput({
    onSubmit,
    onCancel,
    availableTags = [],
    placeholder = 'Type your task... (e.g., "Buy groceries tomorrow #Personal @urgent p1")',
    autoFocus = true,
    className,
}: QuickAddInputProps) {
    const [input, setInput] = useState('')
    const [parsedData, setParsedData] = useState<ParsedTaskData | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showTagAutocomplete, setShowTagAutocomplete] = useState(false)
    const [autocompleteQuery, setAutocompleteQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Parse input with debouncing
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
            if (input.trim()) {
                const parsed = parseTaskNaturalLanguage(input, {
                    currentDate: new Date(),
                    availableProjects: [],
                    availableTags: availableTags.map(t => ({ id: t.id, name: t.name })),
                })
                setParsedData(parsed)
            } else {
                setParsedData(null)
            }
        }, 300)

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [input, availableTags])

    // Detect # or @ for autocomplete
    useEffect(() => {
        const cursorPosition = inputRef.current?.selectionStart || 0
        const textBeforeCursor = input.substring(0, cursorPosition)



        // Check for @ (tag)
        const tagMatch = textBeforeCursor.match(/@(\w*)$/)
        if (tagMatch) {
            setAutocompleteQuery(tagMatch[1])
            setShowTagAutocomplete(true)
            return
        }

        // Hide autocomplete if no match

        setShowTagAutocomplete(false)
    }, [input])

    const handleSubmit = async () => {
        if (!parsedData || !parsedData.title.trim()) return

        setIsSubmitting(true)
        try {
            await onSubmit(parsedData)
            setInput('')
            setParsedData(null)
        } catch (error) {
            console.error('Error submitting task:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Escape') {
            if (showTagAutocomplete) {
                setShowTagAutocomplete(false)
            } else if (onCancel) {
                onCancel()
            }
        }
    }



    const selectTag = (tagName: string) => {
        const cursorPosition = inputRef.current?.selectionStart || 0
        const textBeforeCursor = input.substring(0, cursorPosition)
        const textAfterCursor = input.substring(cursorPosition)

        // Replace the partial tag name with the selected one
        const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${tagName} `)
        setInput(newTextBefore + textAfterCursor)
        setShowTagAutocomplete(false)

        // Focus back on input
        setTimeout(() => {
            inputRef.current?.focus()
            const newPosition = newTextBefore.length
            inputRef.current?.setSelectionRange(newPosition, newPosition)
        }, 0)
    }

    // Filter autocomplete options


    const filteredTags = availableTags.filter(t =>
        t.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
    )

    const formatPriority = (priority: string) => {
        const map: Record<string, string> = {
            urgent: 'P1 (Urgent)',
            high: 'P2 (High)',
            medium: 'P3 (Medium)',
            low: 'P4 (Low)',
        }
        return map[priority] || priority
    }

    return (
        <div className={cn('space-y-3', className)}>
            {/* Input Field */}
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="text-base"
                />



                {/* Tag Autocomplete */}
                {showTagAutocomplete && filteredTags.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredTags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => selectTag(tag.name)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                            >
                                {tag.color && (
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: tag.color }}
                                    />
                                )}
                                <span>{tag.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Parsed Elements Display */}
            {parsedData && (
                <div className="flex flex-wrap gap-2">
                    {parsedData.dueDate && (
                        <ParsedElementChip
                            type="date"
                            value={format(parsedData.dueDate, 'MMM d, h:mm a')}
                        />
                    )}

                    {parsedData.tagNames.map((tag, index) => (
                        <ParsedElementChip
                            key={index}
                            type="tag"
                            value={tag}
                        />
                    ))}
                    {parsedData.priority && (
                        <ParsedElementChip
                            type="priority"
                            value={formatPriority(parsedData.priority)}
                        />
                    )}
                    {parsedData.reminderPattern && (
                        <ParsedElementChip
                            type="reminder"
                            value={parsedData.reminderPattern}
                        />
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={handleSubmit}
                    disabled={!parsedData?.title.trim() || isSubmitting}
                    className="flex-1"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Task
                </Button>
                {onCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground">
                <code className="px-1 py-0.5 bg-muted rounded">@tag</code>,{' '}
                <code className="px-1 py-0.5 bg-muted rounded">p1-p4</code>,{' '}
                <code className="px-1 py-0.5 bg-muted rounded">!reminder</code>, and natural dates
            </p>
        </div>
    )
}
