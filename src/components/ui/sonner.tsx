'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * Sonner, wired to Mentra's theme.
 *
 * It was previously mounted bare in the root layout, which meant two things:
 * no `theme` prop, so sonner fell back to its `light` default and every toast
 * rendered white-on-white regardless of the active theme; and it sat outside
 * `<Providers>`, so it could not have read the theme even if asked.
 *
 * Sonner only understands light and dark, while Mentra ships fifteen themes.
 * The grouping below mirrors the one `globals.css` already declares for
 * `.bg-pattern` — the app's own answer to "is this theme dark?". Duplicating it
 * is not ideal, but inventing a second, different list would be worse, and this
 * is the only other place that needs to ask the question.
 */
const DARK_THEMES = new Set(['dark', 'amoled', 'midnight', 'forest', 'cyberpunk', 'ocean', 'charcoal'])

export function Toaster(props: ToasterProps) {
    // `resolvedTheme` rather than `theme` so "system" arrives as the concrete
    // value it resolved to instead of the literal string "system".
    const { resolvedTheme } = useTheme()

    return (
        <Sonner
            theme={resolvedTheme && DARK_THEMES.has(resolvedTheme) ? 'dark' : 'light'}
            position="bottom-right"
            expand={false}
            richColors
            closeButton
            duration={3000}
            {...props}
        />
    )
}
