/**
 * Calendar-day helpers for Second Brain.
 *
 * Every date this feature stores is a `YYYY-MM-DD` string built from *local* date
 * parts. `toISOString()` is never used: it converts to UTC first, so at 11pm in a
 * positive offset the day silently jumps forward, and the user's evening check-in
 * lands on tomorrow. All conversions go through here so that rule holds everywhere.
 */

/** Local calendar day as `YYYY-MM-DD`. */
export function toDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * `YYYY-MM-DD` back to a Date at local midnight.
 *
 * Explicitly parsed rather than `new Date(key)` — the string form is treated as UTC
 * by the spec, which shifts the date backwards for anyone west of Greenwich.
 */
export function fromDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month - 1, day)
}

/** Today's key. */
export const todayKey = () => toDateKey(new Date())

/**
 * The seven day-keys of the week containing `date`, Monday first.
 *
 * Monday-first because that is how people describe a routine week, and it keeps
 * the weekend adjacent at the end of the strip rather than split across it.
 */
export function weekDays(date: Date): string[] {
    const start = new Date(date)
    // getDay(): 0 = Sunday. Shift so Monday becomes the first column.
    const offsetToMonday = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - offsetToMonday)
    start.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start)
        day.setDate(start.getDate() + i)
        return toDateKey(day)
    })
}

/** Shift a date by whole weeks. Returns a new Date. */
export function addWeeks(date: Date, weeks: number): Date {
    const next = new Date(date)
    next.setDate(next.getDate() + weeks * 7)
    return next
}

/** JS weekday index (0 = Sunday) for a day key. */
export const weekdayOf = (key: string) => fromDateKey(key).getDay()

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LONG_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

/** "Mon" */
export const shortDayName = (key: string) => SHORT_DAY[weekdayOf(key)]

/** Day of the month, unpadded: 7 */
export const dayOfMonth = (key: string) => fromDateKey(key).getDate()

/** "Thursday, 30 July 2026" */
export function longDateLabel(key: string): string {
    const date = fromDateKey(key)
    return `${LONG_DAY[date.getDay()]}, ${date.getDate()} ${MONTH[date.getMonth()]} ${date.getFullYear()}`
}

/** "July 2026", or "Jul – Aug 2026" when the week straddles two months. */
export function weekRangeLabel(days: string[]): string {
    if (days.length === 0) return ''

    const first = fromDateKey(days[0])
    const last = fromDateKey(days[days.length - 1])

    if (first.getMonth() === last.getMonth()) {
        return `${MONTH[first.getMonth()]} ${first.getFullYear()}`
    }

    const firstShort = MONTH[first.getMonth()].slice(0, 3)
    const lastShort = MONTH[last.getMonth()].slice(0, 3)

    return first.getFullYear() === last.getFullYear()
        ? `${firstShort} – ${lastShort} ${last.getFullYear()}`
        : `${firstShort} ${first.getFullYear()} – ${lastShort} ${last.getFullYear()}`
}

/** True when the key is a day already past (strictly before today). */
export const isPast = (key: string) => key < todayKey()

/** True when the key is a future day. Lexical comparison is safe for `YYYY-MM-DD`. */
export const isFuture = (key: string) => key > todayKey()
