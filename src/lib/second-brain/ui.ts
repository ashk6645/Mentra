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

// ─── Spacing ─────────────────────────────────────────────────────────────────

/**
 * The spacing ladder, closed like the others.
 *
 * Eleven gap values were in use — including 2.5, 5 and 7, which sit between the
 * steps and belong to no rhythm. Tailwind's scale is 4px-based, so the ladder is
 * 2 / 4 / 8 / 12 / 16 / 24 / 32. The two sub-4px steps earn their place: an icon
 * beside its label wants 6px, not 8, and forcing them up made inline pairs read
 * as separate things.
 *
 * These are documentation as much as tokens — the values are ordinary Tailwind
 * classes, and the point is that a component reaching for something not on this
 * list means the ladder is wrong, not the component.
 */
export const SPACE = {
    /** Hairline pairings — a glyph and its number. */
    hair: 'gap-0.5',
    /** An icon and its label. */
    tight: 'gap-1.5',
    /** Inside a control. */
    snug: 'gap-2',
    /** The default: between items in a row. */
    base: 'gap-3',
    /** Between stacked blocks inside a section. */
    loose: 'gap-4',
    /** Between distinct groups. */
    section: 'gap-6',
    /** Between major regions of a page. */
    page: 'gap-8',
} as const

// ─── Rows ────────────────────────────────────────────────────────────────────

/**
 * One list row, everywhere.
 *
 * Height, padding, gap, hover and radius were restated per component, and drifted:
 * ten list surfaces had settled on two different heights (py-2 and py-2.5) and two
 * different gaps (gap-3 and gap-2.5). Individually invisible; collectively it is
 * why scrolling the feature felt like several screens by the same author rather
 * than one surface.
 *
 * Deliberately excludes FOCUS. Plenty of rows are plain `div`s that never take
 * focus, and baking a focus ring into all of them would promise an affordance
 * most of them don't have. Interactive rows add it themselves.
 *
 * Compose with layout modifiers: cn(ROW, 'w-full text-left').
 */
export const ROW = `flex items-center gap-3 px-2 py-2 ${R.md} ${HOVER} transition-colors`

// ─── Icon sizes ──────────────────────────────────────────────────────────────

/**
 * A closed set, for the same reason the type and radius ladders are closed.
 *
 * This feature had accumulated nine icon sizes — 10, 11, 12, 14, 15, 16, 17, 18px
 * and a 2.5 — most of them one-off bracket values chosen per component. Nobody
 * decided on nine; they arrived one edit at a time. Linear ships two, and the
 * evenness of its rows is a direct consequence.
 *
 * Three here rather than two, because a 12px inline mark and a 16px control
 * genuinely read differently, and the middle size is what most rows want.
 */
export const ICON = {
    /** Inline with small text: streak flames, meta glyphs, chevrons in a row. */
    sm: 'h-3 w-3',
    /** The default — leading icons in list rows and buttons. */
    md: 'h-3.5 w-3.5',
    /** Primary actions and anything that heads a section. */
    lg: 'h-4 w-4',
} as const

// ─── Hit targets ─────────────────────────────────────────────────────────────

/**
 * Square control boxes. Distinct from ICON: this is the tappable area, the icon
 * inside it is smaller. `sm` is the floor — 24px is the smallest target that is
 * comfortably hittable on a phone.
 */
export const CONTROL = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
} as const

/**
 * Right-hand metadata column widths.
 *
 * Fixed, and right-aligned, so the numbers rule up vertically from row to row.
 * Left to `shrink-0` they ended wherever their content happened to end, giving a
 * ragged edge down the side of every list — the clearest single difference
 * between these lists and Linear's.
 */
export const META = {
    /** A short figure: a count, a percentage, a streak. */
    narrow: 'w-12 shrink-0 text-right',
    /** A phrase: "4/5 this week", a status word. */
    wide: 'w-24 shrink-0 text-right',
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
