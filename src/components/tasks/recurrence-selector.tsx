'use client'

import React from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Repeat } from 'lucide-react'
import { RRule } from 'rrule'

interface RecurrenceSelectorProps {
    value: string // RRule string
    onChange: (rrule: string) => void
}

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
    // Basic presets
    // We'll store simple strings like 'DAILY', 'WEEKLY' etc for state relative to selector, 
    // but actual output value is RRule string

    // Helper to detect current type from value
    const getCurrentType = () => {
        if (!value) return 'NONE'
        if (value.includes('FREQ=DAILY')) return 'DAILY'
        if (value.includes('FREQ=WEEKLY')) return 'WEEKLY'
        if (value.includes('FREQ=MONTHLY')) return 'MONTHLY'
        return 'CUSTOM'
    }

    const handleChange = (type: string) => {
        if (type === 'NONE') {
            onChange('')
            return
        }

        let ruleString = ''
        switch (type) {
            case 'DAILY':
                ruleString = new RRule({ freq: RRule.DAILY }).toString()
                break
            case 'WEEKLY':
                ruleString = new RRule({ freq: RRule.WEEKLY }).toString()
                break
            case 'MONTHLY':
                ruleString = new RRule({ freq: RRule.MONTHLY }).toString()
                break
            default:
                // Custom or others - simplified for now
                ruleString = new RRule({ freq: RRule.DAILY }).toString()
        }
        onChange(ruleString)
    }

    return (
        <Select value={getCurrentType()} onValueChange={handleChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
                <Repeat className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Repeat" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="NONE">No Repeat</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
        </Select>
    )
}
