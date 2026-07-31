/**
 * Visual tokens for Second Brain.
 *
 * Centralised so the surfaces, hairlines and motion stay identical across views.
 * The first pass hard-coded sizes and borders per component and drifted; anything
 * reused twice belongs here.
 *
 * Two rules this encodes:
 *
 * 1. ONE accent. Completion is emerald and nothing else competes with it. Streaks
 *    and "today" markers are rendered in neutral or a whisper of primary, because
 *    three saturated accents fighting on one screen is what separates a hobby UI
 *    from Linear's.
 *
 * 2. Hairlines, not borders. `border-neutral-200` reads heavy at this density;
 *    a 6% black/white line is what Notion and Linear actually use.
 */

/** 1px separator at the weight Linear/Notion use — far lighter than neutral-200. */
export const HAIRLINE = 'border-black/[0.07] dark:border-white/[0.07]'

/**
 * Card/panel surface. Elevation comes from the fill, not a drop shadow.
 *
 * Opaque (`bg-card`) rather than a translucent white overlay, so a sticky column
 * inside the card can use the identical token and composite to the same colour.
 * With a translucent surface the sticky cell sat on a different stack and showed
 * a visible vertical seam wherever it overlapped a tinted row.
 */
export const SURFACE = 'bg-card border ' + HAIRLINE

/** Matches SURFACE's fill exactly — for sticky cells that must not seam. */
export const SURFACE_SOLID = 'bg-card'

/** Row hover. Deliberately faint: it should register without flashing. */
export const HOVER = 'hover:bg-black/[0.025] dark:hover:bg-white/[0.035]'

/** Focus ring, consistent everywhere. */
export const FOCUS =
    'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background'

/** Small caps section label. */
export const LABEL =
    'text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'

/** Any figure that sits in a column and must align vertically. */
export const NUM = 'tabular-nums'

/**
 * Completion bounce.
 *
 * A tween with back-out easing, not a spring: Framer supports only two keyframes
 * under a spring, and the 1 → 1.14 → 1 pop the design system asks for is three.
 * `times` front-loads the overshoot so it reads as a snap rather than a pulse.
 */
export const POP = {
    duration: 0.26,
    times: [0, 0.4, 1],
    ease: [0.34, 1.4, 0.64, 1] as const,
}

/** Non-spring transitions, matching the documented timing scale. */
export const SNAPPY = { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] as const }
export const QUICK = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }

/** Width/height animations read better critically damped — no overshoot on a bar. */
export const BAR_SPRING = { type: 'spring' as const, stiffness: 260, damping: 34 }

/**
 * Heatmap fill for a completion ratio.
 * Stepped rather than a continuous gradient so adjacent days stay distinguishable.
 */
export function intensityClass(done: boolean, scheduled: boolean): string {
    if (!scheduled) return 'bg-black/[0.035] dark:bg-white/[0.04]'
    if (done) return 'bg-emerald-500 dark:bg-emerald-500/90'
    return 'bg-black/[0.09] dark:bg-white/[0.10]'
}
