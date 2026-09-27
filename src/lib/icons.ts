/**
 * How a chosen icon is stored.
 *
 * An icon field holds either an emoji ("🚀") or a Lucide icon written as
 * `lucide:<name>`, where the name is the icon's kebab-case name from
 * lucide.dev ("lucide:rocket"). The prefix keeps the two apart, so every icon
 * saved before Lucide icons existed still renders unchanged.
 */

export const LUCIDE_PREFIX = 'lucide:'

const LUCIDE_VALUE = /^lucide:[a-z0-9]+(?:-[a-z0-9]+)*$/

export const toLucideIcon = (name: string) => `${LUCIDE_PREFIX}${name}`

/** The Lucide icon name in a stored value, or null when it is an emoji. */
export function lucideName(value: string | null | undefined): string | null {
    return value?.startsWith(LUCIDE_PREFIX) ? value.slice(LUCIDE_PREFIX.length) : null
}

/** Whether a value is a well-formed Lucide icon (the name itself is checked when it renders). */
export const isLucideIcon = (value: string) => value.length <= 64 && LUCIDE_VALUE.test(value)
