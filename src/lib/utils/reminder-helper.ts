/**
 * Reminder Time Calculator
 * Parses reminder patterns and calculates when to send reminders
 */

import { subMinutes, subHours, subDays, subWeeks } from 'date-fns'

/**
 * Calculate reminder time from due date and reminder pattern
 * 
 * Supported patterns:
 * - !30min, !1hour, !2hours
 * - !1day, !2days, !1week
 * - at 9am, at 3pm (specific time on due date)
 */
export function calculateReminderTime(dueDate: Date, reminderPattern: string): Date | null {
    const pattern = reminderPattern.toLowerCase().trim()

    // Remove leading ! if present
    const cleaned = pattern.startsWith('!') ? pattern.slice(1) : pattern

    // Parse minutes
    const minuteMatch = cleaned.match(/^(\d+)\s*min(?:ute)?s?$/)
    if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1])
        return subMinutes(dueDate, minutes)
    }

    // Parse hours
    const hourMatch = cleaned.match(/^(\d+)\s*h(?:our)?s?$/)
    if (hourMatch) {
        const hours = parseInt(hourMatch[1])
        return subHours(dueDate, hours)
    }

    // Parse days
    const dayMatch = cleaned.match(/^(\d+)\s*d(?:ay)?s?$/)
    if (dayMatch) {
        const days = parseInt(dayMatch[1])
        return subDays(dueDate, days)
    }

    // Parse weeks
    const weekMatch = cleaned.match(/^(\d+)\s*w(?:eek)?s?$/)
    if (weekMatch) {
        const weeks = parseInt(weekMatch[1])
        return subWeeks(dueDate, weeks)
    }

    // Parse specific time (e.g., "at 9am", "at 3pm")
    const timeMatch = cleaned.match(/^at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
    if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
        const meridiem = timeMatch[3]?.toLowerCase()

        if (meridiem === 'pm' && hours < 12) hours += 12
        if (meridiem === 'am' && hours === 12) hours = 0

        const reminderDate = new Date(dueDate)
        reminderDate.setHours(hours, minutes, 0, 0)
        return reminderDate
    }

    // Default: 30 minutes before if pattern not recognized
    console.warn(`Unknown reminder pattern: ${reminderPattern}, defaulting to 30min`)
    return subMinutes(dueDate, 30)
}

/**
 * Format reminder pattern for display
 */
export function formatReminderPattern(pattern: string): string {
    const cleaned = pattern.toLowerCase().trim()
    const withoutExclamation = cleaned.startsWith('!') ? cleaned.slice(1) : cleaned

    // Standardize common patterns
    if (withoutExclamation.match(/^\d+\s*min/)) return withoutExclamation.replace(/min.*/, 'min')
    if (withoutExclamation.match(/^\d+\s*h/)) return withoutExclamation.replace(/h.*/, 'h')
    if (withoutExclamation.match(/^\d+\s*d/)) return withoutExclamation.replace(/d.*/, 'd')
    if (withoutExclamation.match(/^\d+\s*w/)) return withoutExclamation.replace(/w.*/, 'w')

    return withoutExclamation
}
