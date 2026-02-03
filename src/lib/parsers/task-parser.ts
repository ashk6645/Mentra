/**
 * Natural Language Task Parser
 * Extracts structured data from natural language task input
 * Supports Todoist-style syntax: @tag p1-p4 !reminder dates/times
 */

import { addDays, addWeeks, addMonths, setHours, setMinutes, startOfDay, parse, isValid } from 'date-fns'
import * as chrono from 'chrono-node'

export interface ParsedTaskData {
    title: string
    tagNames: string[]
    priority?: 'urgent' | 'high' | 'medium' | 'low'
    dueDate?: Date
    reminderPattern?: string // e.g., "30min", "1hour", "1day"
    recurrence?: {
        interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
        step?: number
        days?: number[]
    }
    rawInput: string
}

export interface ParserContext {
    currentDate: Date
    availableTags?: { id: string; name: string }[]
}

interface ExtractedElement {
    value: string
    startIndex: number
    endIndex: number
}

/**
 * Main parser function - orchestrates all extraction logic
 */
export function parseTaskNaturalLanguage(
    input: string,
    context: ParserContext = { currentDate: new Date() }
): ParsedTaskData {
    let workingInput = input.trim()

    // Extract elements in order (to avoid conflicts)
    const tags = extractTags(workingInput)
    const priority = extractPriority(workingInput)
    const reminder = extractReminder(workingInput)
    const recurrence = extractRecurrence(workingInput)

    // Build exclude list for date parser to avoid picking up parts of other elements
    // (e.g. "every monday" -> recurrence takes it, date parser shouldn't take "monday")
    const excludeRanges: { start: number; end: number }[] = []

    tags.forEach(t => excludeRanges.push({ start: t.startIndex, end: t.endIndex }))
    if (priority) excludeRanges.push({ start: priority.startIndex, end: priority.endIndex })
    if (reminder) excludeRanges.push({ start: reminder.startIndex, end: reminder.endIndex })
    if (recurrence) excludeRanges.push({ start: recurrence.startIndex, end: recurrence.endIndex })

    const dateTime = extractDateTime(workingInput, context.currentDate, excludeRanges)

    // Remove all extracted elements to get clean title
    const elementsToRemove: ExtractedElement[] = []

    if (tags.length > 0) elementsToRemove.push(...tags)
    if (priority) elementsToRemove.push(priority)
    if (reminder) elementsToRemove.push(reminder)
    if (recurrence) elementsToRemove.push(recurrence)
    if (dateTime.extracted) elementsToRemove.push(dateTime.extracted)

    const title = cleanTaskTitle(workingInput, elementsToRemove)

    return {
        title: title || 'Untitled Task',
        tagNames: tags.map(t => t.value.substring(1)), // Remove @ prefix
        priority: priority ? mapPriorityToLevel(priority.value) : undefined,
        dueDate: dateTime.date,
        reminderPattern: reminder?.value.substring(1), // Remove ! prefix
        recurrence: recurrence ? parseRecurrence(recurrence.value) : undefined,
        rawInput: input,
    }
}



/**
 * Extract all tags from @tagName patterns
 */
export function extractTags(input: string): ExtractedElement[] {
    const regex = /@(\w+)/g
    const tags: ExtractedElement[] = []
    let match

    while ((match = regex.exec(input)) !== null) {
        tags.push({
            value: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        })
    }

    return tags
}

/**
 * Extract priority from p1, p2, p3, p4 patterns
 */
export function extractPriority(input: string): ExtractedElement | null {
    const regex = /\bp([1-4])\b/i
    const match = input.match(regex)

    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    return null
}

/**
 * Extract reminder pattern from !time patterns
 * Supports: !30min, !1hour, !2hours, !1day, !14:00
 */
export function extractReminder(input: string): ExtractedElement | null {
    const regex = /!(\d+(?:min|hour|hours|day|days)|\d{1,2}:\d{2})/i
    const match = input.match(regex)

    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    return null
}

/**
 * Extract date and time using chrono-node
 */
export function extractDateTime(
    input: string,
    baseDate: Date = new Date(),
    excludeRanges: { start: number; end: number }[] = []
): { date?: Date; extracted?: ExtractedElement } {
    // Determine the type of Chrono instance to use based on the input
    // Using default en/standard configuration
    const results = chrono.parse(input, baseDate, { forwardDate: true })

    // Find the first result that doesn't overlap with excluded ranges
    for (const result of results) {
        const start = result.index
        const end = result.index + result.text.length

        const isOverlapping = excludeRanges.some(range =>
            (start >= range.start && start < range.end) ||
            (end > range.start && end <= range.end) ||
            (start <= range.start && end >= range.end)
        )

        if (!isOverlapping) {
            // Check if chrono matched a loose word that isn't really a date date
            // e.g. "and" or "at" without time. Chrono is usually good but let's be safe.
            // If it has no known components, skip it.
            if (result.start) {
                return {
                    date: result.start.date(),
                    extracted: {
                        value: result.text,
                        startIndex: start,
                        endIndex: end
                    }
                }
            }
        }
    }

    return { date: undefined, extracted: undefined }
}

/**
 * Remove extracted elements from input to get clean title
 */
function cleanTaskTitle(input: string, elements: ExtractedElement[]): string {
    // Sort elements by start index in reverse order
    const sorted = [...elements].sort((a, b) => b.startIndex - a.startIndex!)

    let result = input
    for (const element of sorted) {
        const before = result.substring(0, element.startIndex)
        const after = result.substring(element.endIndex)
        result = before + after
    }

    // Clean up multiple spaces
    return result.replace(/\s+/g, ' ').trim()
}

/**
 * Map p1-p4 to priority levels
 */
function mapPriorityToLevel(priorityStr: string): 'urgent' | 'high' | 'medium' | 'low' {
    const match = priorityStr.match(/p([1-4])/i)
    if (!match) return 'low'

    const level = parseInt(match[1])
    switch (level) {
        case 1: return 'urgent'
        case 2: return 'high'
        case 3: return 'medium'
        case 4: return 'low'
        default: return 'low'
    }
}

/**
 * Calculate reminder time based on pattern and due date
 */
export function calculateReminderTime(dueDate: Date, pattern: string): Date | null {
    const lowerPattern = pattern.toLowerCase()

    // Minutes pattern (e.g., "30min")
    const minMatch = lowerPattern.match(/(\d+)min/)
    if (minMatch) {
        const minutes = parseInt(minMatch[1])
        return new Date(dueDate.getTime() - minutes * 60 * 1000)
    }

    // Hours pattern (e.g., "1hour", "2hours")
    const hourMatch = lowerPattern.match(/(\d+)hours?/)
    if (hourMatch) {
        const hours = parseInt(hourMatch[1])
        return new Date(dueDate.getTime() - hours * 60 * 60 * 1000)
    }

    // Days pattern (e.g., "1day", "2days")
    const dayMatch = lowerPattern.match(/(\d+)days?/)
    if (dayMatch) {
        const days = parseInt(dayMatch[1])
        return new Date(dueDate.getTime() - days * 24 * 60 * 60 * 1000)
    }

    // Specific time pattern (e.g., "14:00")
    const timeMatch = lowerPattern.match(/(\d{1,2}):(\d{2})/)
    if (timeMatch) {
        const hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])
        const reminderDate = new Date(dueDate)
        reminderDate.setHours(hours, minutes, 0, 0)
        return reminderDate
    }

    return null
}

/**
 * Extract recurrence patterns
 * Supports: 
 * - every day, daily, every [day]
 * - every week, weekly
 * - every month, monthly, 1st of month
 * - every weekday (Mon-Fri)
 * - every [specific day] (every monday)
 */
export function extractRecurrence(input: string): ExtractedElement | null {
    // 1. "every weekday" (Mon-Fri)
    const weekdayRegex = /\bevery weekdays?\b/i
    let match = input.match(weekdayRegex)
    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    // 2. "1st of month", "first of month", "15th of month"
    const monthDayRegex = /\b(\d{1,2}(?:st|nd|rd|th)?|first|last) of (?:the )?month\b/i
    match = input.match(monthDayRegex)
    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    // 3. "every X days/weeks/months" or "every day/week/month"
    const everyRegex = /\bevery (\d+ )?(day|week|month|year)s?\b/i
    match = input.match(everyRegex)
    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    // 4. "daily", "weekly", "monthly", "yearly"
    const adverbRegex = /\b(daily|weekly|monthly|yearly)\b/i
    match = input.match(adverbRegex)
    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    // 5. "every [weekday]" e.g., "every monday", "every friday"
    const daysRegex = /\bevery (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    match = input.match(daysRegex)
    if (match) {
        return {
            value: match[0],
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
        }
    }

    return null
}

/**
 * Parse extracted recurrence string into structured data
 */
export function parseRecurrence(input: string): ParsedTaskData['recurrence'] | undefined {
    const lower = input.toLowerCase()

    // Every weekday (Mon-Fri)
    if (lower.includes('every weekday')) {
        return {
            interval: 'weekly',
            step: 1,
            days: [1, 2, 3, 4, 5] // Monday to Friday
        }
    }

    // 1st of month, 15th of month, etc.
    const monthDayMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)? of (?:the )?month/)
    if (monthDayMatch) {
        const dayOfMonth = parseInt(monthDayMatch[1])
        return {
            interval: 'monthly',
            step: 1,
            days: [dayOfMonth] // Store day of month
        }
    }

    // First of month / Last of month
    if (lower.includes('first of')) {
        return { interval: 'monthly', step: 1, days: [1] }
    }
    if (lower.includes('last of')) {
        return { interval: 'monthly', step: 1, days: [31] } // Backend should handle last day logic
    }

    // Daily
    if (lower.includes('daily') || lower.includes('every day')) {
        return { interval: 'daily', step: 1 }
    }

    // Weekly
    if (lower.includes('weekly') || lower.includes('every week')) {
        return { interval: 'weekly', step: 1 }
    }

    // Monthly
    if (lower.includes('monthly') || lower.includes('every month')) {
        return { interval: 'monthly', step: 1 }
    }

    // Yearly
    if (lower.includes('yearly') || lower.includes('every year')) {
        return { interval: 'yearly', step: 1 }
    }

    // Every X ...
    const stepMatch = lower.match(/every (\d+) (day|week|month|year)s?/)
    if (stepMatch) {
        const step = parseInt(stepMatch[1])
        const unit = stepMatch[2] as 'day' | 'week' | 'month' | 'year'
        return {
            interval: (unit + 'ly') as 'daily' | 'weekly' | 'monthly' | 'yearly',
            step: step
        }
    }

    // Every [Weekday]
    const dowMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
    if (dowMatch) {
        const dayMap: { [key: string]: number } = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
        }
        return {
            interval: 'weekly',
            step: 1,
            days: [dayMap[dowMatch[1]]]
        }
    }

    return undefined
}
