import { createElement } from 'react'
import {
    Dumbbell,
    BookOpen,
    Brain,
    Target,
    Moon,
    Sunrise,
    Footprints,
    Droplet,
    PenLine,
    Headphones,
    Salad,
    Code2,
    Flower2,
    HeartPulse,
    Wallet,
    Phone,
    type LucideIcon,
} from 'lucide-react'

/**
 * Habit iconography.
 *
 * Deliberately a curated Lucide set rather than emoji. Emoji render differently on
 * every platform, carry their own colour and weight, can't inherit `currentColor`,
 * and sit optically off-baseline next to text — which is why no considered product
 * uses them as primary iconography. A single stroked set at one weight is the
 * difference between "app" and "side project".
 */

export interface HabitIconDef {
    id: string
    label: string
    Icon: LucideIcon
}

export const HABIT_ICONS: HabitIconDef[] = [
    { id: 'dumbbell', label: 'Training', Icon: Dumbbell },
    { id: 'run', label: 'Running', Icon: Footprints },
    { id: 'heart', label: 'Health', Icon: HeartPulse },
    { id: 'meditate', label: 'Meditation', Icon: Flower2 },
    { id: 'book', label: 'Reading', Icon: BookOpen },
    { id: 'brain', label: 'Study', Icon: Brain },
    { id: 'code', label: 'Code', Icon: Code2 },
    { id: 'pen', label: 'Writing', Icon: PenLine },
    { id: 'target', label: 'Focus', Icon: Target },
    { id: 'water', label: 'Hydration', Icon: Droplet },
    { id: 'food', label: 'Nutrition', Icon: Salad },
    { id: 'music', label: 'Listening', Icon: Headphones },
    { id: 'sunrise', label: 'Morning', Icon: Sunrise },
    { id: 'moon', label: 'Evening', Icon: Moon },
    { id: 'wallet', label: 'Finance', Icon: Wallet },
    { id: 'phone', label: 'Connect', Icon: Phone },
]

const BY_ID = new Map(HABIT_ICONS.map(def => [def.id, def]))

/**
 * Emoji already written to localStorage by earlier builds, mapped onto the new set.
 * Without this every existing demo habit would fall back to the same generic glyph
 * and the seeded data would look broken after upgrading.
 */
const LEGACY_EMOJI: Record<string, string> = {
    '🏋️': 'dumbbell',
    '🏃': 'run',
    '📖': 'book',
    '📚': 'brain',
    '🎯': 'target',
    '🧘': 'meditate',
    '💧': 'water',
    '🌙': 'moon',
    '✍️': 'pen',
    '🎧': 'music',
    '🥗': 'food',
    '💻': 'code',
    '✅': 'target',
}

export const DEFAULT_ICON_ID = 'target'

/** Resolve a stored icon value — new id or legacy emoji — to a component. */
export function resolveHabitIcon(stored: string | undefined): LucideIcon {
    if (!stored) return BY_ID.get(DEFAULT_ICON_ID)!.Icon

    const direct = BY_ID.get(stored)
    if (direct) return direct.Icon

    const legacy = LEGACY_EMOJI[stored]
    if (legacy) return BY_ID.get(legacy)!.Icon

    return BY_ID.get(DEFAULT_ICON_ID)!.Icon
}

/**
 * Single place the icon is rendered, so stroke weight and optical size stay
 * identical everywhere. Lucide's default 2px stroke reads heavy at 16px; 1.75
 * matches the text weight beside it.
 */
export function HabitIcon({
    icon,
    className,
}: {
    icon: string | undefined
    className?: string
}) {
    // createElement rather than `const Icon = ...; <Icon />`. The component is only
    // *selected* from a static map, never constructed, but assigning it to a local
    // and rendering it as JSX is indistinguishable from defining a component during
    // render as far as the React Compiler's lint is concerned.
    return createElement(resolveHabitIcon(icon), {
        className,
        strokeWidth: 1.75,
        'aria-hidden': true,
    })
}
