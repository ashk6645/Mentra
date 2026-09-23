'use client'

import { Fragment, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { IconButton } from './primitives'
import { FLOAT, ICON, R } from '@/lib/second-brain/ui'

export interface MenuAction {
    label: string
    icon: LucideIcon
    onSelect: () => void
    destructive?: boolean
    /** Draw a separator above this item. */
    separated?: boolean
}

/**
 * The "…" menu on a card or row.
 *
 * Wraps the app's Radix dropdown rather than rebuilding it, and restyles it to
 * the feature's float surface and fast timing so it opens on the same beat as
 * everything else here.
 */
export function ActionMenu({
    label,
    actions,
    trigger,
}: {
    /** Accessible name for the trigger, e.g. "Routine actions". */
    label: string
    actions: MenuAction[]
    trigger?: ReactNode
}) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                {trigger ?? <IconButton icon={MoreHorizontal} label={label} />}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={6}
                className={cn('min-w-[180px] p-1 duration-[120ms]', R.lg, FLOAT)}
            >
                {actions.map(action => (
                    <Fragment key={action.label}>
                        {action.separated && <DropdownMenuSeparator className="my-1" />}
                        <DropdownMenuItem
                            variant={action.destructive ? 'destructive' : 'default'}
                            onSelect={action.onSelect}
                            className={cn('h-8 gap-2.5 px-2 text-[13px]', R.md)}
                        >
                            <action.icon className={ICON.md} strokeWidth={2} />
                            {action.label}
                        </DropdownMenuItem>
                    </Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
