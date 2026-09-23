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

/** The key `count` days after `key`. Negative goes back. */
export function addDays(key: string, count: number): string {
    const date = fromDateKey(key)
    date.setDate(date.getDate() + count)
    return toDateKey(date)
}

/**
 * The seven day-keys of the week containing `date`, Monday first.
 *
 * Monday-first because that is how people describe a working week, and it keeps
 * the weekend together at the end.
 */
export function weekDays(date: Date): string[] {
    const start = new Date(date)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    start.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start)
        day.setDate(start.getDate() + i)
        return toDateKey(day)
    })
}

/** Every day key in the month containing `date`. */
export function monthDays(date: Date): string[] {
    const year = date.getFullYear()
    const month = date.getMonth()
    const count = new Date(year, month + 1, 0).getDate()

    return Array.from({ length: count }, (_, i) => toDateKey(new Date(year, month, i + 1)))
}

/** JS weekday index (0 = Sunday) for a day key. */
export const weekdayOf = (key: string) => fromDateKey(key).getDay()

/** Monday-first weekday order, in JS weekday numbers. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LONG_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

/** "Mon" */
export const shortDayName = (key: string) => SHORT_DAY[weekdayOf(key)]

/** "Monday" — for a JS weekday number. */
export const longDayName = (weekday: number) => LONG_DAY[weekday]

/** Day of the month, unpadded: 7 */
export const dayOfMonth = (key: string) => fromDateKey(key).getDate()

/** "Thursday, 24 September" */
export function longDateLabel(key: string): string {
    const date = fromDateKey(key)
    return `${LONG_DAY[date.getDay()]}, ${date.getDate()} ${MONTH[date.getMonth()]}`
}

/** "22 – 28 Sep", or "29 Sep – 5 Oct" when the week straddles two months. */
export function weekRangeLabel(days: string[]): string {
    if (days.length === 0) return ''

    const first = fromDateKey(days[0])
    const last = fromDateKey(days[days.length - 1])
    const month = (d: Date) => MONTH[d.getMonth()].slice(0, 3)
    const year = last.getFullYear() === new Date().getFullYear() ? '' : ` ${last.getFullYear()}`

    return first.getMonth() === last.getMonth()
        ? `${first.getDate()} – ${last.getDate()} ${month(last)}${year}`
        : `${first.getDate()} ${month(first)} – ${last.getDate()} ${month(last)}${year}`
}

/** "September", or "September 2027" outside the current year. */
export function monthLabel(date: Date): string {
    const name = MONTH[date.getMonth()]
    return date.getFullYear() === new Date().getFullYear() ? name : `${name} ${date.getFullYear()}`
}

/**
 * Time left, in words: "Due today", "12 days left", "4 months left", "3 days overdue".
 * Months are approximate on purpose — nobody needs "127 days" to know it's a while.
 */
export function timeLeftLabel(daysLeft: number): string {
    if (daysLeft === 0) return 'Due today'
    if (daysLeft === 1) return 'Due tomorrow'
    if (daysLeft < 0) {
        const late = Math.abs(daysLeft)
        return `${late} ${late === 1 ? 'day' : 'days'} overdue`
    }
    if (daysLeft < 45) return `${daysLeft} days left`

    const months = Math.round(daysLeft / 30)
    return `${months} months left`
}
