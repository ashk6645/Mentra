'use client'

import { useEffect, useState } from 'react'
import { Icon, type IconNode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { lucideName } from '@/lib/icons'

/**
 * Renders a stored icon value: an emoji as text, or a Lucide icon.
 *
 * Lucide icons are loaded one at a time, only when shown, so an app full of
 * emoji never downloads the icon library and a page of icons downloads only
 * the icons on it. Loaded icons are cached for the session, so they render
 * immediately the next time — the sidebar doesn't flicker on navigation.
 *
 * Either kind is sized `1em`, so it takes the size of the text around it and
 * can replace an emoji anywhere without restyling.
 */

type Loader = () => Promise<{ __iconNode: IconNode }>

const cache = new Map<string, IconNode>()
let loaders: Promise<Record<string, Loader>> | null = null

/** The name → loader map is itself loaded lazily, the first time a Lucide icon is shown. */
const loadersOnce = () => (loaders ??= import('lucide-react/dynamicIconImports').then(m => m.default as Record<string, Loader>))

export async function loadIconNode(name: string): Promise<IconNode | null> {
    const cached = cache.get(name)
    if (cached) return cached
    const load = (await loadersOnce())[name]
    if (!load) return null
    const { __iconNode } = await load()
    cache.set(name, __iconNode)
    return __iconNode
}

export function AppIcon({
    value,
    fallback = '📁',
    className,
    strokeWidth = 1.9,
}: {
    /** The stored value; empty shows the fallback emoji. */
    value: string | null | undefined
    fallback?: string
    className?: string
    strokeWidth?: number
}) {
    const name = lucideName(value)
    // Held in state, not just the module cache, so the component re-renders when it arrives.
    const [loaded, setLoaded] = useState<{ name: string; node: IconNode } | null>(null)

    useEffect(() => {
        if (!name || cache.has(name)) return
        let live = true
        loadIconNode(name).then(node => {
            if (live && node) setLoaded({ name, node })
        })
        return () => {
            live = false
        }
    }, [name])

    if (!name) {
        return (
            <span aria-hidden className={cn('inline-flex items-center justify-center leading-none', className)}>
                {value || fallback}
            </span>
        )
    }

    const node = cache.get(name) ?? (loaded?.name === name ? loaded.node : undefined)
    if (!node) return <span aria-hidden className={cn('inline-block h-[1em] w-[1em] shrink-0', className)} />
    return <Icon iconNode={node} size="1em" strokeWidth={strokeWidth} aria-hidden className={cn('shrink-0', className)} />
}
