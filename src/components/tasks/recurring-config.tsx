'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Repeat, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecurringConfigProps {
    isRecurring: boolean
    recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
    recurrenceStep?: number | null
    recurrenceDays?: number[] | null
    onUpdate: (config: {
        isRecurring: boolean
        recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
        recurrenceStep?: number | null
        recurrenceDays?: number[] | null
    }) => void
}

export function RecurringConfig({
    isRecurring,
    recurrenceInterval,
    recurrenceStep,
    recurrenceDays,
    onUpdate
}: RecurringConfigProps) {
    const [open, setOpen] = useState(false)

    const getRecurrenceText = () => {
        if (!isRecurring || !recurrenceInterval) return 'Set recurring'

        const step = recurrenceStep || 1
        
        if (recurrenceDays && recurrenceDays.length > 0) {
            // Weekdays
            if (recurrenceDays.length === 5 && 
                recurrenceDays.includes(1) && 
                recurrenceDays.includes(2) && 
                recurrenceDays.includes(3) && 
                recurrenceDays.includes(4) && 
                recurrenceDays.includes(5)) {
                return 'Every weekday'
            }
            
            // Specific day of week
            if (recurrenceInterval === 'weekly' && recurrenceDays.length === 1) {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                return `Every ${dayNames[recurrenceDays[0]]}`
            }

            // Day of month
            if (recurrenceInterval === 'monthly' && recurrenceDays.length === 1) {
                const day = recurrenceDays[0]
                const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
                return `${day}${suffix} of month`
            }
        }

        // Standard intervals
        if (step === 1) {
            return recurrenceInterval.charAt(0).toUpperCase() + recurrenceInterval.slice(1)
        }

        return `Every ${step} ${recurrenceInterval.replace('ly', '')}s`
    }

    const presets = [
        { label: 'Daily', interval: 'daily' as const, step: 1 },
        { label: 'Every weekday', interval: 'weekly' as const, step: 1, days: [1, 2, 3, 4, 5] },
        { label: 'Weekly', interval: 'weekly' as const, step: 1 },
        { label: 'Every 2 weeks', interval: 'weekly' as const, step: 2 },
        { label: 'Monthly', interval: 'monthly' as const, step: 1 },
        { label: '1st of month', interval: 'monthly' as const, step: 1, days: [1] },
        { label: 'Yearly', interval: 'yearly' as const, step: 1 },
    ]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={isRecurring ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                        "h-8 gap-2 text-sm font-normal",
                        isRecurring && "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-950/50"
                    )}
                >
                    <Repeat className="h-3.5 w-3.5" />
                    <span>{getRecurrenceText()}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Quick presets
                    </div>
                    {presets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                onUpdate({
                                    isRecurring: true,
                                    recurrenceInterval: preset.interval,
                                    recurrenceStep: preset.step,
                                    recurrenceDays: preset.days || [],
                                })
                                setOpen(false)
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-left"
                        >
                            <span>{preset.label}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    ))}
                    
                    {isRecurring && (
                        <>
                            <div className="h-px bg-border my-1" />
                            <button
                                onClick={() => {
                                    onUpdate({
                                        isRecurring: false,
                                        recurrenceInterval: null,
                                        recurrenceStep: null,
                                        recurrenceDays: null,
                                    })
                                    setOpen(false)
                                }}
                                className="w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-left text-muted-foreground"
                            >
                                Remove recurrence
                            </button>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
