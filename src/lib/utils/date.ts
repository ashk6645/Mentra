import { format, isToday, isTomorrow, isYesterday, isPast, isFuture, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined, formatStr: string = 'MMM d, yyyy'): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d, yyyy h:mm a')
}

/**
 * Format relative date (Today, Tomorrow, Yesterday, or formatted date)
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isToday(dateObj)) return 'Today'
  if (isTomorrow(dateObj)) return 'Tomorrow'
  if (isYesterday(dateObj)) return 'Yesterday'

  const daysAway = differenceInDays(dateObj, new Date())
  
  if (daysAway > 0 && daysAway <= 7) {
    return format(dateObj, 'EEEE') // Day of week
  }

  return format(dateObj, 'MMM d')
}

/**
 * Get human-readable time ago
 */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const minutes = differenceInMinutes(now, dateObj)
  const hours = differenceInHours(now, dateObj)
  const days = differenceInDays(now, dateObj)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return formatDate(dateObj, 'MMM d')
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isPast(dateObj) && !isToday(dateObj)
}

/**
 * Check if date is upcoming (within 7 days)
 */
export function isUpcoming(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const daysAway = differenceInDays(dateObj, new Date())
  return daysAway > 0 && daysAway <= 7
}

/**
 * Get date range for smart lists
 */
export function getDateRange(type: 'today' | 'upcoming' | 'week'): { start: Date; end: Date } {
  const now = new Date()

  switch (type) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      }
    case 'upcoming':
      return {
        start: addDays(startOfDay(now), 1),
        end: addDays(endOfDay(now), 7),
      }
    case 'week':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      }
  }
}

/**
 * Parse natural language date
 */
export function parseNaturalDate(input: string): Date | null {
  const lowerInput = input.toLowerCase().trim()
  const now = new Date()

  // Today
  if (['today', 'tod'].includes(lowerInput)) {
    return startOfDay(now)
  }

  // Tomorrow
  if (['tomorrow', 'tmr', 'tom'].includes(lowerInput)) {
    return startOfDay(addDays(now, 1))
  }

  // Yesterday
  if (['yesterday'].includes(lowerInput)) {
    return startOfDay(subDays(now, 1))
  }

  // Days of week
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayIndex = daysOfWeek.findIndex(day => day.startsWith(lowerInput))
  if (dayIndex !== -1) {
    const currentDay = now.getDay()
    let daysToAdd = dayIndex - currentDay
    if (daysToAdd <= 0) daysToAdd += 7 // Next week if day has passed
    return startOfDay(addDays(now, daysToAdd))
  }

  // In X days
  const inDaysMatch = lowerInput.match(/in (\d+) days?/)
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1])
    return startOfDay(addDays(now, days))
  }

  return null
}

/**
 * Get color for date status
 */
export function getDateColor(date: Date | string | null | undefined): string {
  if (!date) return 'text-muted-foreground'
  
  if (isOverdue(date)) return 'text-destructive'
  if (isToday(date)) return 'text-blue-600 dark:text-blue-400'
  if (isTomorrow(date)) return 'text-amber-600 dark:text-amber-400'
  
  return 'text-muted-foreground'
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Get time slots for time picker
 */
export function getTimeSlots(interval: number = 30): string[] {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const date = new Date()
      date.setHours(hour, minute, 0, 0)
      slots.push(format(date, 'h:mm a'))
    }
  }
  return slots
}
