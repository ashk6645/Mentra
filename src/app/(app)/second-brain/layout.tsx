import { SecondBrainNav } from '@/components/second-brain/sb-nav'
import { MotionProvider } from '@/components/second-brain/motion-provider'
import { cn } from '@/lib/utils'
import { HAIRLINE, PAGE } from '@/lib/second-brain/ui'

/**
 * Shared chrome for every Second Brain section.
 *
 * The nav lives here rather than in each page so its indicators glide between
 * routes instead of remounting.
 */
export default function SecondBrainLayout({ children }: { children: React.ReactNode }) {
    return (
        <MotionProvider>
            <div className="flex h-full flex-col">
                <div className={cn('shrink-0 border-b', HAIRLINE)}>
                    <div className={cn(PAGE, 'pt-2')}>
                        <SecondBrainNav />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </MotionProvider>
    )
}
