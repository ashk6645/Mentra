import { cn } from '@/lib/utils'
import { PAGE } from '@/lib/second-brain/ui'

/**
 * The frame every Second Brain page sits in: the shared width and gutter, and
 * the vertical rhythm between a page's sections.
 */
export function SecondBrainPage({ children }: { children: React.ReactNode }) {
    return <div className={cn(PAGE, 'flex flex-col gap-6 pb-24 pt-8 sm:pt-10')}>{children}</div>
}
