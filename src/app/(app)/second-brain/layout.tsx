import { BrainCircuit } from 'lucide-react'
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
                    <div className={cn(PAGE, 'pt-4')}>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <BrainCircuit className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                            <span className="text-[12px] font-medium tracking-[0.01em]">Second Brain</span>
                        </div>
                        <SecondBrainNav />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </MotionProvider>
    )
}
