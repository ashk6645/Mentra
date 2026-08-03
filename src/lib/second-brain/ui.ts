/**
 * Design tokens for Second Brain.
 *
 * Three rules this encodes:
 *
 * 1. ONE accent. Completion is emerald and nothing else competes with it. Streaks
 *    and "today" markers render in neutral or a whisper of primary — three
 *    saturated accents fighting on one screen is what separates a hobby UI from
 *    a considered one.
 *
 * 2. Hairlines, not borders. `border-neutral-200` reads heavy at this density;
 *    a ~7% line is what Linear and Notion actually use.
 *
 * 3. A closed set of sizes, radii and weights. The previous pass invented values
 *    per component and ended up with ten font sizes and eight radii across one
 *    feature — which is drift, not a system. Everything below is fixed; if a
 *    component needs a size that isn't here, the scale is wrong, not the component.
 */

// ─── Surfaces ────────────────────────────────────────────────────────────────

/** 1px separator, at the weight Linear/Notion use. */
export const HAIRLINE = 'border-black/[0.07] dark:border-white/[0.07]'

/**
 * Card/panel surface. Elevation comes from the fill, not a drop shadow.
 *
 * Opaque (`bg-card`) rather than a translucent overlay, so a sticky column inside
 * the card can use the identical token and composite to the same colour. With a
 * translucent surface the sticky cell sat on a different stack and seamed.
 */
export const SURFACE = 'bg-card border ' + HAIRLINE

/** Matches SURFACE's fill exactly — for sticky cells that must not seam. */
export const SURFACE_SOLID = 'bg-card'

/** Row hover. Deliberately faint: it should register without flashing. */
export const HOVER = 'hover:bg-black/[0.025] dark:hover:bg-white/[0.035]'

/** Focus ring, consistent everywhere. */
export const FOCUS =
    'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background'

// ─── Radii ───────────────────────────────────────────────────────────────────
// Linear's ladder: 4 / 6 / 8 / 12 / 16. Nothing in between.

export const R = {
    /** Heatmap squares, tiny marks. */
    xs: 'rounded-[4px]',
    /** Checkboxes, chips inside a control. */
    sm: 'rounded-[6px]',
    /** Buttons, cells, inputs — the default. */
    md: 'rounded-[8px]',
    /** Cards and panels. */
    lg: 'rounded-[12px]',
    /** The largest containers. */
    xl: 'rounded-[16px]',
    full: 'rounded-full',
} as const

// ─── Type scale ──────────────────────────────────────────────────────────────
// Tracking goes negative as size grows and positive on small caps — the thing
// that makes headings read "engineered" rather than merely large.

export const T = {
    /**
     * Page title.
     *
     * 22px, not 28px. A page title is orientation — you read it once on arrival
     * and then never look at it again — so at 28px it was the loudest thing on a
     * screen whose actual content is the list underneath. This is the size dense
     * working tools settle on for the same reason.
     */
    display: 'text-[22px] font-semibold leading-[1.25] tracking-[-0.02em]',
    /** Section heading inside a panel. */
    title: 'text-[15px] font-semibold leading-[1.3] tracking-[-0.01em]',
    /** Default reading size. */
    body: 'text-[13px] leading-[1.5]',
    /** Secondary text, hints, metadata. */
    label: 'text-[12px] leading-[1.4]',
    /** Figures, counts, dense meta. */
    caption: 'text-[11px] font-medium leading-[1.4]',
    /** Uppercase column and section labels. Positive tracking, as small caps need. */
    eyebrow: 'text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.04em]',
    /** Interactive labels. */
    button: 'text-[13px] font-medium leading-[1.2]',
} as const

/** Uppercase section label, pre-coloured. The most-repeated combination. */
export const LABEL = `${T.eyebrow} text-muted-foreground`

/** Any figure that sits in a column and must align vertically. */
export const NUM = 'tabular-nums'

/**
 * Text hierarchy, four steps.
 * Matching Linear's ink → muted → subtle → tertiary rather than sprinkling
 * arbitrary `/70` and `/85` opacities per component.
 */
export const INK = {
    strong: 'text-foreground',
    default: 'text-foreground/85',
    muted: 'text-muted-foreground',
    subtle: 'text-muted-foreground/60',
} as const

// ─── Motion ──────────────────────────────────────────────────────────────────

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
