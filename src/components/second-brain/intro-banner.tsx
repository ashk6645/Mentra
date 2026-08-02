'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from './confirm-dialog'
import { useSecondBrainActions, useStoreReady } from '@/lib/second-brain/repo'
import { useShowIntro, dismissIntro } from '@/lib/second-brain/repo/preferences'
import { notify } from '@/lib/second-brain/feedback'
import { R, T, INK, FOCUS, HAIRLINE } from '@/lib/second-brain/ui'

/**
 * First run (spec §61).
 *
 * The problem this solves is specific: a new arrival lands on a month of habit
 * history, logged workouts and journal entries that they did not write, with
 * nothing saying so. Either they assume the app invented data about them, or —
 * worse — they start using it and never notice their real entries are mixed in
 * with fiction.
 *
 * So this says three true things and offers the two actions that follow from
 * them. It is a banner rather than a modal because nothing here needs to block
 * the door; §37 and §60 both favour explaining in place over interrupting.
 */
export function IntroBanner() {
    const ready = useStoreReady()
    const show = useShowIntro()
    const { clearAll } = useSecondBrainActions()
    const { confirm, dialog } = useConfirm()

    // `useShowIntro` is false until hydration, so this also prevents the banner
    // flashing in before the store is readable.
    if (!ready || !show) return null

    const startFresh = async () => {
        const confirmed = await confirm({
            title: 'Clear the demo data?',
            description:
                'Every habit, workout, note and transaction currently here is removed, leaving an empty Second Brain. You can bring the demo back from Settings.',
            confirmLabel: 'Clear it',
            destructive: true,
        })
        if (!confirmed) return

        clearAll()
        dismissIntro()
        notify('Cleared. This is yours now.')
    }

    return (
        <>
            {dialog}

            <aside
                className={cn('relative border px-4 py-3.5 sm:px-5', R.lg, HAIRLINE, 'bg-foreground/[0.02]')}
                aria-labelledby="sb-intro-title"
            >
                <button
                    type="button"
                    onClick={dismissIntro}
                    aria-label="Dismiss the introduction"
                    className={cn(
                        'absolute right-2 top-2 flex h-7 w-7 items-center justify-center',
                        R.sm, INK.subtle, 'transition-colors hover:text-foreground', FOCUS
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                </button>

                <h2 id="sb-intro-title" className={cn('pr-8', T.button, INK.strong)}>
                    This is demo data
                </h2>

                <p className={cn('mt-1.5 max-w-[62ch]', T.body, INK.muted)}>
                    The habits, workouts and entries below are made up, so there is something to
                    look at. Everything here is saved in this browser only — it never reaches a
                    server, does not sync to your phone, and clearing site data removes it.
                    Your tasks, projects and notes are unaffected and live where they always have.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={startFresh}
                        className={cn('px-3 py-1.5', R.md, T.button,
                            'bg-foreground text-background transition-opacity hover:opacity-90', FOCUS)}
                    >
                        Clear it and start fresh
                    </button>
                    <button
                        type="button"
                        onClick={dismissIntro}
                        className={cn('border px-3 py-1.5', R.md, T.button, INK.default, HAIRLINE,
                            'transition-colors hover:bg-foreground/[0.04]', FOCUS)}
                    >
                        Keep exploring
                    </button>
                </div>
            </aside>
        </>
    )
}
