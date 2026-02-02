/**
 * Format recurrence pattern into human-readable text
 */
export function formatRecurrence(
    interval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null,
    step?: number | null,
    days?: number[] | null
): string {
    if (!interval) return 'Recurring'

    const actualStep = step || 1

    // Handle weekdays pattern
    if (days && days.length === 5 &&
        days.includes(1) && days.includes(2) && days.includes(3) &&
        days.includes(4) && days.includes(5)) {
        return 'Every weekday'
    }

    // Handle specific day of week
    if (interval === 'weekly' && days && days.length === 1) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return `Every ${dayNames[days[0]]}`
    }

    // Handle day of month
    if (interval === 'monthly' && days && days.length === 1) {
        const day = days[0]
        const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
        return `${day}${suffix} of month`
    }

    // Standard intervals with step
    if (actualStep === 1) {
        switch (interval) {
            case 'daily': return 'Daily'
            case 'weekly': return 'Weekly'
            case 'monthly': return 'Monthly'
            case 'yearly': return 'Yearly'
        }
    }

    // Custom step
    const unit = interval.replace('ly', '')
    return `Every ${actualStep} ${unit}s`
}
