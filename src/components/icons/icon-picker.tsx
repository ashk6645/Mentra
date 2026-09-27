'use client'

import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Segmented } from '@/components/second-brain/segmented'
import { cn } from '@/lib/utils'
import { lucideName } from '@/lib/icons'
import { FLOAT, R } from '@/lib/second-brain/ui'

/**
 * Choose an icon: any of Lucide's icons, searchable, or an emoji.
 *
 * The icon library is loaded only when the picker is first opened — or when
 * the pointer reaches the trigger, so it's usually ready by the click. The
 * value is a string (see `@/lib/icons`); render it with `AppIcon`.
 *
 * `children` is the trigger, so each place can style its own.
 */

const loadLibrary = () => import('./icon-library-panel')
const IconLibraryPanel = lazy(loadLibrary)

const EMOJI = [
    '📁', '💼', '🏠', '🎯', '🚀', '💡', '📚', '🎨',
    '⚙️', '🔧', '🌟', '📊', '🎵', '🏋️', '🍳', '🌿',
]

type Tab = 'icons' | 'emoji'

export function IconPicker({
    value,
    onChange,
    children,
    align = 'start',
    emoji = true,
}: {
    value: string | null | undefined
    onChange: (value: string) => void
    children: ReactNode
    align?: 'start' | 'center' | 'end'
    /** Offer emoji beside the icons. Off where only line icons belong. */
    emoji?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [chosenTab, setTab] = useState<Tab>(() => (value && !lucideName(value) ? 'emoji' : 'icons'))
    const tab = emoji ? chosenTab : 'icons'

    const pick = (next: string) => {
        onChange(next)
        setOpen(false)
    }

    return (
        // Modal, so it scrolls even inside a dialog that locks scrolling around itself.
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild onPointerEnter={loadLibrary} onFocus={loadLibrary}>
                {children}
            </PopoverTrigger>
            <PopoverContent
                align={align}
                className={cn('w-[328px] p-0 pt-2', R.lg, FLOAT)}
                // Start in the search field, not on the tabs. (While the library is
                // still loading, its field focuses itself when it mounts.)
                onOpenAutoFocus={e => {
                    e.preventDefault()
                    const content = e.currentTarget as HTMLElement
                    content.querySelector<HTMLElement>('input, [role=option]')?.focus()
                }}
            >
                {emoji && (
                    <div className="px-2 pb-2">
                        <Segmented
                            fill
                            ariaLabel="Icon type"
                            value={tab}
                            onChange={setTab}
                            options={[{ id: 'icons', label: 'Icons' }, { id: 'emoji', label: 'Emoji' }]}
                        />
                    </div>
                )}

                {tab === 'icons' ? (
                    <Suspense fallback={<div className="h-[328px]" aria-busy="true" />}>
                        <IconLibraryPanel value={value} onPick={pick} />
                    </Suspense>
                ) : (
                    <div role="listbox" aria-label="Emoji" className="grid grid-cols-8 gap-0.5 px-2 pb-2">
                        {EMOJI.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                role="option"
                                aria-selected={value === emoji}
                                onClick={() => pick(emoji)}
                                className={cn(
                                    'flex h-9 items-center justify-center text-[20px] outline-none', R.md,
                                    'hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/[0.07]',
                                    value === emoji && 'bg-primary/12'
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
