import { SecondBrainNav } from '@/components/second-brain/sb-nav'

/**
 * Shared chrome for every Second Brain section.
 *
 * The nav lives here rather than in each page so the active-section indicator
 * animates between routes instead of remounting, and so adding a section is one
 * entry in SECTIONS rather than an edit to every page.
 */
export default function SecondBrainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-black/[0.07] dark:border-white/[0.07]">
                <div className="mx-auto max-w-5xl px-5 pb-3 pt-5 sm:px-8 sm:pt-6">
                    <SecondBrainNav />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
    )
}
