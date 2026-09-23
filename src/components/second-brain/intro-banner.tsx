'use client'

import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from './confirm-dialog'
import { Button, Card, IconButton, Reveal } from './primitives'
import { useSecondBrainActions, useStoreReady } from '@/lib/second-brain/repo'
import { useShowIntro, dismissIntro } from '@/lib/second-brain/repo/preferences'
import { notify } from '@/lib/second-brain/feedback'
import { INK, T } from '@/lib/second-brain/ui'

/**
 * First run.
 *
 * A new arrival lands on a month of history they didn't write. Without a word
 * about it they either assume the app invented data about them, or start using
 * it and never notice their real entries are mixed in with sample ones. So this
 * says so plainly, once, and offers the two things that follow from it.
 */
export function IntroBanner({ index }: { index: number }) {
    const ready = useStoreReady()
    const show = useShowIntro()
    const { clearAll } = useSecondBrainActions()
    const { confirm, dialog } = useConfirm()

    // `useShowIntro` is false until hydration, so the banner can't flash in early.
    if (!ready || !show) return dialog

    const startFresh = async () => {
        const confirmed = await confirm({
            title: 'Clear the sample data?',
            description: 'Every sample habit, routine and goal is removed, leaving Second Brain empty and ready for yours.',
            confirmLabel: 'Clear everything',
            destructive: true,
        })
        if (!confirmed) return

        clearAll()
        dismissIntro()
        notify('Cleared. It’s all yours now.')
    }

    return (
        <>
            {dialog}
            <Reveal index={index}>
                <Card className="flex flex-col gap-3 py-3.5 pl-4 pr-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-black/[0.04] sm:flex dark:bg-white/[0.06]">
                        <Sparkles className={cn('h-4 w-4', INK.default)} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className={cn(T.body, 'font-medium', INK.strong)}>You’re looking at sample data</p>
                        <p className={cn(T.meta, INK.muted)}>
                            It lives only in this browser. Your tasks and projects aren’t touched.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button size="sm" onClick={startFresh}>Start fresh</Button>
                        <Button size="sm" variant="ghost" onClick={dismissIntro} className="sm:hidden">Keep it</Button>
                        <IconButton icon={X} label="Keep the sample data" onClick={dismissIntro} className="hidden sm:inline-flex" />
                    </div>
                </Card>
            </Reveal>
        </>
    )
}
