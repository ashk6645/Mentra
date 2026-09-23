import { createElement } from 'react'
import {
    BookOpen, Brain, Code2, Droplet, Dumbbell, Flower2, Footprints, Headphones,
    HeartPulse, Moon, PenLine, Phone, Salad, Sunrise, Target, Wallet,
    type LucideIcon,
} from 'lucide-react'

/**
 * Habit and routine iconography.
 *
 * A curated Lucide set rather than emoji. Emoji render differently on every
 * platform, carry their own colour, can't inherit `currentColor`, and sit off the
 * text baseline. One stroked set at one weight is the difference between an app
 * and a side project. Sixteen, so the picker is a clean 8 × 2.
 */

export interface IconDef {
    id: string
    label: string
    Icon: LucideIcon
}

export const ICONS: IconDef[] = [
    { id: 'target', label: 'Focus', Icon: Target },
    { id: 'dumbbell', label: 'Training', Icon: Dumbbell },
    { id: 'run', label: 'Walking', Icon: Footprints },
    { id: 'heart', label: 'Health', Icon: HeartPulse },
    { id: 'meditate', label: 'Meditation', Icon: Flower2 },
    { id: 'book', label: 'Reading', Icon: BookOpen },
    { id: 'brain', label: 'Study', Icon: Brain },
    { id: 'code', label: 'Code', Icon: Code2 },
    { id: 'pen', label: 'Writing', Icon: PenLine },
    { id: 'water', label: 'Hydration', Icon: Droplet },
    { id: 'food', label: 'Nutrition', Icon: Salad },
    { id: 'music', label: 'Listening', Icon: Headphones },
    { id: 'sunrise', label: 'Morning', Icon: Sunrise },
    { id: 'moon', label: 'Evening', Icon: Moon },
    { id: 'wallet', label: 'Money', Icon: Wallet },
    { id: 'phone', label: 'Connect', Icon: Phone },
]

const BY_ID = new Map(ICONS.map(def => [def.id, def.Icon]))

export const DEFAULT_ICON = 'target'

/**
 * The single place an icon is rendered, so stroke weight stays identical
 * everywhere. Lucide's default 2px stroke reads heavy at 14px; 1.75 matches the
 * text beside it. Unknown ids fall back rather than rendering nothing.
 */
export function ItemIcon({ icon, className }: { icon: string; className?: string }) {
    // createElement rather than `const Icon = …; <Icon />` — assigning a component
    // to a local during render reads as defining one to the React Compiler's lint.
    return createElement(BY_ID.get(icon) ?? Target, {
        className,
        strokeWidth: 1.75,
        'aria-hidden': true,
    })
}
