'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ParsedElementChip } from './parsed-element-chip'
import { parseTaskNaturalLanguage, ParsedTaskData } from '@/lib/parsers/task-parser'
import { format } from 'date-fns'
import { Loader2, Plus } from 'lucide-react'
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
    placeholder = 'meeting tomorrow @work p2 !daily',
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

    const hasInput = input.trim().length > 0

    const hasChips =
        parsedData &&
        (parsedData.dueDate ||
            parsedData.tagNames.length > 0 ||
            parsedData.priority ||
            parsedData.reminderPattern)

    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            if (input.trim()) {
                const parsed = parseTaskNaturalLanguage(input, {
                    currentDate: new Date(),
                    availableTags: availableTags.map(t => ({ id: t.id, name: t.name })),
                })
                setParsedData(parsed)
            } else {
                setParsedData(null)
            }
        }, 300)
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        }
    }, [input, availableTags])

    useEffect(() => {
        const cursorPosition = inputRef.current?.selectionStart || 0
        const textBeforeCursor = input.substring(0, cursorPosition)
        const tagMatch = textBeforeCursor.match(/@(\w*)$/)
        if (tagMatch) {
            setAutocompleteQuery(tagMatch[1])
            setShowTagAutocomplete(true)
            return
        }
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
        const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${tagName} `)
        setInput(newTextBefore + textAfterCursor)
        setShowTagAutocomplete(false)
        setTimeout(() => {
            inputRef.current?.focus()
            const newPosition = newTextBefore.length
            inputRef.current?.setSelectionRange(newPosition, newPosition)
        }, 0)
    }

    const filteredTags = availableTags.filter(t =>
        t.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
    )

    const formatPriority = (priority: string) => {
        const map: Record<string, string> = {
            urgent: 'P1 · Urgent',
            high: 'P2 · High',
            medium: 'P3 · Medium',
            low: 'P4 · Low',
        }
        return map[priority] || priority
    }

    return (
        <div className={cn('flex flex-col gap-2', className)}>

            {/* ── Unified Input Card ── */}
            <div
                className={cn(
                    'rounded-xl border bg-background transition-all duration-200',
                    'border-border/50 hover:border-border/80',
                    hasInput
                        ? 'border-border shadow-sm'
                        : 'border-border/50'
                )}
            >
                {/* Row 1: Text input */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                    {/* Subtle circle icon */}
                    <div
                        className={cn(
                            'w-4 h-4 rounded-full border-2 shrink-0 transition-colors duration-200',
                            hasInput
                                ? 'border-foreground/40'
                                : 'border-muted-foreground/25'
                        )}
                    />
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        className={cn(
                            'flex-1 bg-transparent text-sm outline-none',
                            'placeholder:text-muted-foreground/40',
                            'text-foreground'
                        )}
                    />
                </div>

                {/* Row 2: Chips — only when they exist, inside the card */}
                {hasChips && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pt-0">
                        {parsedData.dueDate && (
                            <ParsedElementChip
                                type="date"
                                value={format(parsedData.dueDate, 'MMM d, h:mm a')}
                            />
                        )}
                        {parsedData.tagNames.map((tag, index) => (
                            <ParsedElementChip key={index} type="tag" value={tag} />
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
            </div>

            {/* ── Tag Autocomplete ── */}
            {showTagAutocomplete && filteredTags.length > 0 && (
                <div className="bg-popover border border-border/60 rounded-lg shadow-md z-50 max-h-44 overflow-y-auto py-1">
                    {filteredTags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => selectTag(tag.name)}
                            className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent/60 transition-colors flex items-center gap-2.5"
                        >
                            {tag.color ? (
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: tag.color }}
                                />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                            )}
                            <span>{tag.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Action Row ── */}
            <div className="flex items-center justify-between gap-2">

                {/* Helper hint — left side */}
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                    <code className="font-mono">@tag</code>
                    {' · '}
                    <code className="font-mono">p1–p4</code>
                    {' · '}
                    <code className="font-mono">!remind</code>
                    {' · '}
                    natural dates
                </p>

                {/* Buttons — right side */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        onClick={handleSubmit}
                        disabled={!hasInput || isSubmitting}
                        size="sm"
                        className={cn(
                            'h-8 px-3.5 text-xs font-medium rounded-lg gap-1.5',
                            'transition-all duration-200',
                            hasInput && !isSubmitting
                                ? 'shadow-[0_0_0_3px_hsl(var(--ring)/0.15)]'
                                : 'shadow-none'
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Plus className="h-3 w-3" />
                        )}
                        Create
                    </Button>
                     {onCancel && (
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="h-8 px-3 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

        </div>
    )
}