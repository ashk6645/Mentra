import { AppIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Library icons take the project's colour; emoji keep their own. */
const TINT: Record<string, string> = {
    red: 'text-red-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    gray: 'text-gray-500',
}

/** A project's icon, sized to the text around it. */
export function ProjectIcon({ icon, color, className }: { icon: string | null | undefined; color?: string | null; className?: string }) {
    return <AppIcon value={icon} className={cn(color && TINT[color], className)} />
}
