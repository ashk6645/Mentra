/**
 * Natural Language Task Parser
 * Extracts structured data from natural language task input
 * Supports Todoist-style syntax: #project @tag p1-p4 !reminder dates/times
 */

import { addDays, addWeeks, addMonths, setHours, setMinutes, startOfDay, parse, isValid } from 'date-fns'

export interface ParsedTaskData {
    title: string
    projectName?: string
    tagNames: string[]
    priority?: 'urgent' | 'high' | 'medium' | 'low'
    dueDate?: Date
    reminderPattern?: string // e.g., "30min", "1hour", "1day"
    rawInput: string
}

export interface ParserContext {
    currentDate: Date
    availableProjects?: { id: string; name: string }[]
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
    const project = extractProject(workingInput)
    const tags = extractTags(workingInput)
    const priority = extractPriority(workingInput)
    const reminder = extractReminder(workingInput)
    const dateTime = extractDateTime(workingInput, context.currentDate)

    // Remove all extracted elements to get clean title
    const elementsToRemove: ExtractedElement[] = []

    if (project) elementsToRemove.push(project)
    if (tags.length > 0) elementsToRemove.push(...tags)
    if (priority) elementsToRemove.push(priority)
    if (reminder) elementsToRemove.push(reminder)
    if (dateTime.extracted) elementsToRemove.push(dateTime.extracted)

    const title = cleanTaskTitle(workingInput, elementsToRemove)

    return {
        title: title || 'Untitled Task',
        projectName: project?.value.substring(1), // Remove # prefix
        tagNames: tags.map(t => t.value.substring(1)), // Remove @ prefix
        priority: priority ? mapPriorityToLevel(priority.value) : undefined,
        dueDate: dateTime.date,
        reminderPattern: reminder?.value.substring(1), // Remove ! prefix
        rawInput: input,
    }
}

/**
 * Extract project name from #projectName pattern
 */
export function extractProject(input: string): ExtractedElement | null {
    const regex = /#(\w+)/
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
 * Extract date and time from natural language
 * Supports: today, tomorrow, next week, monday, at 3pm, etc.
 */
export function extractDateTime(
    input: string,
    baseDate: Date = new Date()
): { date?: Date; extracted?: ExtractedElement } {
    const lowerInput = input.toLowerCase()

    // Try relative dates first
    const relativeDate = extractRelativeDate(lowerInput, baseDate)
    if (relativeDate.date) {
        // Check for time component
        const timeResult = extractTime(lowerInput, relativeDate.date)
        return {
            date: timeResult.date || relativeDate.date,
            extracted: relativeDate.extracted,
        }
    }

    // Try day names
    const dayNameDate = extractDayName(lowerInput, baseDate)
    if (dayNameDate.date) {
        const timeResult = extractTime(lowerInput, dayNameDate.date)
        return {
            date: timeResult.date || dayNameDate.date,
            extracted: dayNameDate.extracted,
        }
    }

    // Try absolute dates
    const absoluteDate = extractAbsoluteDate(lowerInput, baseDate)
    if (absoluteDate.date) {
        const timeResult = extractTime(lowerInput, absoluteDate.date)
        return {
            date: timeResult.date || absoluteDate.date,
            extracted: absoluteDate.extracted,
        }
    }

    // Try time only (defaults to today)
    const timeOnly = extractTime(lowerInput, baseDate)
    if (timeOnly.date) {
        return timeOnly
    }

    return { date: undefined, extracted: undefined }
}

/**
 * Extract relative dates: today, tomorrow, next week, in X days
 */
function extractRelativeDate(
    input: string,
    baseDate: Date
): { date?: Date; extracted?: ExtractedElement } {
    // Today
    if (/\btoday\b/.test(input)) {
        const match = input.match(/\btoday\b/)
        return {
            date: startOfDay(baseDate),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    // Tomorrow
    if (/\btomorrow\b/.test(input)) {
        const match = input.match(/\btomorrow\b/)
        return {
            date: startOfDay(addDays(baseDate, 1)),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    // In X days
    const inDaysMatch = input.match(/\bin (\d+) days?\b/)
    if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1])
        return {
            date: startOfDay(addDays(baseDate, days)),
            extracted: {
                value: inDaysMatch[0],
                startIndex: inDaysMatch.index!,
                endIndex: inDaysMatch.index! + inDaysMatch[0].length,
            },
        }
    }

    // Next week
    if (/\bnext week\b/.test(input)) {
        const match = input.match(/\bnext week\b/)
        return {
            date: startOfDay(addWeeks(baseDate, 1)),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    // Next month
    if (/\bnext month\b/.test(input)) {
        const match = input.match(/\bnext month\b/)
        return {
            date: startOfDay(addMonths(baseDate, 1)),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    return { date: undefined, extracted: undefined }
}

/**
 * Extract day names: monday, next friday, this saturday
 */
function extractDayName(
    input: string,
    baseDate: Date
): { date?: Date; extracted?: ExtractedElement } {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = baseDate.getDay()

    for (let i = 0; i < days.length; i++) {
        const dayName = days[i]
        const nextPattern = new RegExp(`\\bnext ${dayName}\\b`)
        const thisPattern = new RegExp(`\\bthis ${dayName}\\b`)
        const plainPattern = new RegExp(`\\b${dayName}\\b`)

        let match = input.match(nextPattern)
        if (match) {
            const daysToAdd = (i - currentDay + 7) % 7 || 7
            return {
                date: startOfDay(addDays(baseDate, daysToAdd)),
                extracted: {
                    value: match[0],
                    startIndex: match.index!,
                    endIndex: match.index! + match[0].length,
                },
            }
        }

        match = input.match(thisPattern)
        if (match) {
            const daysToAdd = (i - currentDay + 7) % 7
            return {
                date: startOfDay(addDays(baseDate, daysToAdd)),
                extracted: {
                    value: match[0],
                    startIndex: match.index!,
                    endIndex: match.index! + match[0].length,
                },
            }
        }

        match = input.match(plainPattern)
        if (match) {
            const daysToAdd = (i - currentDay + 7) % 7 || 7
            return {
                date: startOfDay(addDays(baseDate, daysToAdd)),
                extracted: {
                    value: match[0],
                    startIndex: match.index!,
                    endIndex: match.index! + match[0].length,
                },
            }
        }
    }

    return { date: undefined, extracted: undefined }
}

/**
 * Extract absolute dates: Jan 25, 2026-01-30, 25/01/2026
 */
function extractAbsoluteDate(
    input: string,
    baseDate: Date
): { date?: Date; extracted?: ExtractedElement } {
    // Month name + day (e.g., "Jan 25", "January 25")
    const monthDayMatch = input.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})\b/)
    if (monthDayMatch) {
        const monthStr = monthDayMatch[1]
        const day = parseInt(monthDayMatch[2])
        const year = baseDate.getFullYear()

        const monthMap: { [key: string]: number } = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        }

        const month = monthMap[monthStr]
        if (month !== undefined) {
            const date = new Date(year, month, day)
            if (isValid(date)) {
                return {
                    date: startOfDay(date),
                    extracted: {
                        value: monthDayMatch[0],
                        startIndex: monthDayMatch.index!,
                        endIndex: monthDayMatch.index! + monthDayMatch[0].length,
                    },
                }
            }
        }
    }

    // ISO format (2026-01-30)
    const isoMatch = input.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
    if (isoMatch) {
        const date = parse(isoMatch[0], 'yyyy-MM-dd', baseDate)
        if (isValid(date)) {
            return {
                date: startOfDay(date),
                extracted: {
                    value: isoMatch[0],
                    startIndex: isoMatch.index!,
                    endIndex: isoMatch.index! + isoMatch[0].length,
                },
            }
        }
    }

    return { date: undefined, extracted: undefined }
}

/**
 * Extract time: at 3pm, 14:00, morning, evening
 */
function extractTime(
    input: string,
    baseDate: Date
): { date?: Date; extracted?: ExtractedElement } {
    // 12-hour format with am/pm (e.g., "3pm", "3:30pm", "at 3pm")
    const time12Match = input.match(/\b(?:at )?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/)
    if (time12Match) {
        let hours = parseInt(time12Match[1])
        const minutes = time12Match[2] ? parseInt(time12Match[2]) : 0
        const meridiem = time12Match[3]

        if (meridiem === 'pm' && hours !== 12) hours += 12
        if (meridiem === 'am' && hours === 12) hours = 0

        const date = setMinutes(setHours(baseDate, hours), minutes)
        return {
            date,
            extracted: {
                value: time12Match[0],
                startIndex: time12Match.index!,
                endIndex: time12Match.index! + time12Match[0].length,
            },
        }
    }

    // 24-hour format (e.g., "14:00", "at 14:00")
    const time24Match = input.match(/\b(?:at )?(\d{1,2}):(\d{2})\b/)
    if (time24Match) {
        const hours = parseInt(time24Match[1])
        const minutes = parseInt(time24Match[2])

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            const date = setMinutes(setHours(baseDate, hours), minutes)
            return {
                date,
                extracted: {
                    value: time24Match[0],
                    startIndex: time24Match.index!,
                    endIndex: time24Match.index! + time24Match[0].length,
                },
            }
        }
    }

    // Named times
    if (/\bmorning\b/.test(input)) {
        const match = input.match(/\bmorning\b/)
        return {
            date: setMinutes(setHours(baseDate, 9), 0),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    if (/\bafternoon\b/.test(input)) {
        const match = input.match(/\bafternoon\b/)
        return {
            date: setMinutes(setHours(baseDate, 14), 0),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    if (/\bevening\b/.test(input)) {
        const match = input.match(/\bevening\b/)
        return {
            date: setMinutes(setHours(baseDate, 18), 0),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    if (/\bnight\b/.test(input)) {
        const match = input.match(/\bnight\b/)
        return {
            date: setMinutes(setHours(baseDate, 20), 0),
            extracted: match ? {
                value: match[0],
                startIndex: match.index!,
                endIndex: match.index! + match[0].length,
            } : undefined,
        }
    }

    return { date: undefined, extracted: undefined }
}

/**
 * Remove extracted elements from input to get clean title
 */
function cleanTaskTitle(input: string, elements: ExtractedElement[]): string {
    // Sort elements by start index in reverse order
    const sorted = [...elements].sort((a, b) => b.startIndex - a.startIndex)

    let result = input
    for (const element of sorted) {
        result = result.substring(0, element.startIndex) + result.substring(element.endIndex)
    }

    return result.trim()
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
