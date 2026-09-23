'use client'

import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './primitives'
import { FLOAT, HAIRLINE, INK, MOTION, R, T } from '@/lib/second-brain/ui'

/**
 * Dialogs and panels for Second Brain.
 *
 * Built on Radix for focus trapping, Escape and scroll lock, but animated with
 * Framer on the same curve and durations as everything else. The app's shared
 * dialog and sheet run on their own timings — a 500ms sheet beside a 200ms
 * checkbox is exactly the uneven pace this feature is trying not to have.
 *
 * Both stay mounted through their exit animation (`forceMount` under
 * AnimatePresence), so closing is as considered as opening.
 */

function Backdrop() {
    return (
        <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
                className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] dark:bg-black/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MOTION.base}
            />
        </DialogPrimitive.Overlay>
    )
}

/**
 * A centred dialog, anchored high rather than dead centre — the eye lands where
 * the page's content starts, and a dialog that grows (a picker revealing more
 * options) grows downward instead of jumping.
 */
export function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    width = 460,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    children?: ReactNode
    footer?: ReactNode
    width?: number
}) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <DialogPrimitive.Portal forceMount>
                        <Backdrop />
                        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pb-8 pt-[10vh]">
                            <DialogPrimitive.Content asChild forceMount>
                                <motion.div
                                    className={cn('pointer-events-auto relative flex w-full flex-col', R.xl, FLOAT, 'outline-none')}
                                    style={{ maxWidth: width }}
                                    initial={{ opacity: 0, y: 8, scale: 0.985 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.985 }}
                                    transition={MOTION.base}
                                >
                                    <header className="flex items-start justify-between gap-4 px-5 pb-1 pt-5">
                                        <div className="min-w-0">
                                            <DialogPrimitive.Title className={cn(T.title, 'text-[15px]', INK.strong)}>
                                                {title}
                                            </DialogPrimitive.Title>
                                            {description ? (
                                                <DialogPrimitive.Description className={cn('mt-1', T.meta, INK.muted)}>
                                                    {description}
                                                </DialogPrimitive.Description>
                                            ) : (
                                                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
                                            )}
                                        </div>
                                        <DialogPrimitive.Close asChild>
                                            <IconButton icon={X} label="Close" className="-mr-1.5 -mt-1" />
                                        </DialogPrimitive.Close>
                                    </header>

                                    {children ? <div className="px-5 py-4">{children}</div> : <div className="h-4" />}

                                    {footer && (
                                        <footer className={cn('flex items-center gap-2 border-t px-5 py-3', HAIRLINE)}>
                                            {footer}
                                        </footer>
                                    )}
                                </motion.div>
                            </DialogPrimitive.Content>
                        </div>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    )
}

/**
 * A panel docked to the right edge — the detail view for one record.
 *
 * It slides only 24px rather than the full width: the eye should register that
 * something arrived from the side, not watch it travel across the screen.
 */
export function Panel({
    open,
    onOpenChange,
    label,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Accessible title. The panel draws its own visible heading. */
    label: string
    children: ReactNode
}) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <DialogPrimitive.Portal forceMount>
                        <Backdrop />
                        <DialogPrimitive.Content asChild forceMount>
                            <motion.div
                                className={cn(
                                    'fixed inset-y-2 right-2 z-50 flex w-[calc(100%-16px)] max-w-[520px] flex-col overflow-hidden outline-none',
                                    R.xl, FLOAT
                                )}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={MOTION.slow}
                            >
                                <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
                                <DialogPrimitive.Description className="sr-only">{label}</DialogPrimitive.Description>
                                {children}
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    )
}

/** The close control for a Panel's own header. */
export function PanelClose() {
    return (
        <DialogPrimitive.Close asChild>
            <IconButton icon={X} label="Close" />
        </DialogPrimitive.Close>
    )
}
