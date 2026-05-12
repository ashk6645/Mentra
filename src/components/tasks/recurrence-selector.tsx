'use client'

import React, { useState, useEffect } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Repeat, Check, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export interface RecurrenceValue {
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
    step?: number
    days?: number[] // 0=Sun, 1=Mon...
}

interface RecurrenceSelectorProps {
    value?: RecurrenceValue
    onChange: (value?: RecurrenceValue) => void
    className?: string
}

export function RecurrenceSelector({ value, onChange, className }: RecurrenceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<'presets' | 'custom'>('presets')

    // Custom state
    const [customInterval, setCustomInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
    const [customStep, setCustomStep] = useState(1)
    const [customDays, setCustomDays] = useState<number[]>([])

    // Presets configuration
    const isWeekdays = value?.interval === 'daily' && value?.days?.length === 5 &&
        [1, 2, 3, 4, 5].every(d => value.days?.includes(d))

    const isDaily = value?.interval === 'daily' && (!value.days || value.days.length === 0) && (value.step === 1 || !value.step)
    const isWeekly = value?.interval === 'weekly' && (!value.days || value.days.length === 0) && (value.step === 1 || !value.step)
    const isMonthly = value?.interval === 'monthly' && (value.step === 1 || !value.step)
    const isYearly = value?.interval === 'yearly' && (value.step === 1 || !value.step)
    const isCustom = value && !isDaily && !isWeekly && !isMonthly && !isYearly && !isWeekdays

    /* eslint-disable react-hooks/set-state-in-effect -- sync custom recurrence fields from value when popover opens */
    useEffect(() => {
        if (value) {
            setCustomInterval(value.interval)
            setCustomStep(value.step || 1)
            setCustomDays(value.days || [])
        }
    }, [value, isOpen])
    /* eslint-enable react-hooks/set-state-in-effect */

    const handlePreset = (type: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'none') => {
        if (type === 'none') {
            onChange(undefined)
            setIsOpen(false)
            return
        }

        if (type === 'weekdays') {
            onChange({
                interval: 'daily',
                step: 1,
                days: [1, 2, 3, 4, 5]
            })
            setIsOpen(false)
            return
        }

        onChange({
            interval: type,
            step: 1,
            days: []
        })
        setIsOpen(false)
    }

    const handleCustomSave = () => {
        onChange({
            interval: customInterval,
            step: customStep,
            days: customInterval === 'weekly' || customInterval === 'daily' ? customDays : []
        })
        setIsOpen(false)
        setMode('presets')
    }

    const toggleDay = (day: number) => {
        if (customDays.includes(day)) {
            setCustomDays(customDays.filter(d => d !== day))
        } else {
            setCustomDays([...customDays, day].sort())
        }
    }

    const getLabel = () => {
        if (!value) return 'Repeat'
        if (isDaily) return 'Daily'
        if (isWeekdays) return 'Weekdays'
        if (isWeekly) return 'Weekly'
        if (isMonthly) return 'Monthly'
        if (isYearly) return 'Yearly'

        // Custom formatting
        const unit = customInterval === 'daily' ? 'days' :
            customInterval === 'weekly' ? 'weeks' :
                customInterval === 'monthly' ? 'months' : 'years'

        if (value.days && value.days.length > 0) {
            if (value.interval === 'weekly') {
                return `Every ${value.days.length} days` // Simplified label, real app would list days
            }
        }

        return `Every ${value.step} ${unit}`
    }

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) setMode('presets')
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-8 gap-1.5 px-2.5 text-[13px] font-medium rounded-md border bg-transparent shadow-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring/25',
                        value
                            ? 'border-border/60 text-foreground'
                            : 'border-dashed border-border/45 text-muted-foreground hover:border-border/65',
                        className
                    )}
                >
                    <Repeat className="h-3.5 w-3.5 shrink-0 opacity-80 stroke-[1.5]" />
                    {getLabel()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                {mode === 'presets' ? (
                    <div className="space-y-1">
                        <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => handlePreset('none')}>
                            <span className="flex-1 text-left">No Repeat</span>
                            {!value && <Check className="h-4 w-4" />}
                        </Button>
                        <div className="h-px bg-muted my-1" />
                        <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => handlePreset('daily')}>
                            <span className="flex-1 text-left">Daily</span>
                            {isDaily && <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => handlePreset('weekdays')}>
                            <span className="flex-1 text-left">Weekdays <span className="text-muted-foreground ml-1">(M-F)</span></span>
                            {isWeekdays && <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => handlePreset('weekly')}>
                            <span className="flex-1 text-left">Weekly</span>
                            {isWeekly && <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => handlePreset('monthly')}>
                            <span className="flex-1 text-left">Monthly</span>
                            {isMonthly && <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start font-normal" onClick={() => handlePreset('yearly')}>
                            <span className="flex-1 text-left">Yearly</span>
                            {isYearly && <Check className="h-4 w-4" />}
                        </Button>
                        <div className="h-px bg-muted my-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between font-normal"
                            onClick={() => setMode('custom')}
                        >
                            <span>Custom...</span>
                            {isCustom && <Check className="h-4 w-4" />}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 pt-1 pb-2 px-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMode('presets')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold">Custom Recurrence</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Every</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={999}
                                    value={customStep}
                                    onChange={(e) => setCustomStep(parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 text-center"
                                />
                                <Select
                                    value={customInterval}
                                    onValueChange={(v: 'daily' | 'weekly' | 'monthly' | 'yearly') => setCustomInterval(v)}
                                >
                                    <SelectTrigger className="h-8 flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Day(s)</SelectItem>
                                        <SelectItem value="weekly">Week(s)</SelectItem>
                                        <SelectItem value="monthly">Month(s)</SelectItem>
                                        <SelectItem value="yearly">Year(s)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(customInterval === 'weekly' || customInterval === 'daily') && (
                                <div className="space-y-1.5">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Repeat on</span>
                                    <div className="flex justify-between gap-1">
                                        {dayLabels.map((label, idx) => (
                                            <button
                                                key={idx}
                                                className={cn(
                                                    "w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors border",
                                                    customDays.includes(idx)
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                                                )}
                                                onClick={() => toggleDay(idx)}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button size="sm" className="w-full" onClick={handleCustomSave}>
                                Save Preset
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
