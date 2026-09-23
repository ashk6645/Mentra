/**
 * Design tokens for Second Brain.
 *
 * Every size, colour step, radius and duration the feature uses is defined here,
 * and the set is closed on purpose: if a component needs a value that isn't here,
 * the scale is wrong, not the component. That is what keeps four screens reading
 * as one surface rather than four screens by the same author.
 *
 * Three rules it encodes:
 *
 * 1. One accent. Completion is emerald and nothing else competes with it. "Behind"
 *    is the only warning colour, and it only ever appears as a small dot and word.
 * 2. Hairlines, not borders. Structure comes from 6% lines and whitespace.
 * 3. One pace. Three durations and one curve, shared by CSS and Framer, so a
 *    menu, a checkbox and a page all move with the same rhythm.
 */

// ─── Motion ──────────────────────────────────────────────────────────────────

/**
 * The curve. A strong ease-out: movement starts immediately and settles softly,
 * which reads as responsive rather than floaty.
 */
export const EASE = [0.22, 1, 0.36, 1] as const
const EASE_CSS = 'ease-[cubic-bezier(0.22,1,0.36,1)]'

/**
 * Three speeds.
 * - fast: state that should feel instant — hover, press, a tick, a menu.
 * - base: things that change shape — dialogs, toggles, rows appearing.
 * - slow: things that travel — the page reveal, a panel sliding in.
 */
export const DURATION = { fast: 0.12, base: 0.2, slow: 0.32 } as const

export const MOTION = {
    fast: { duration: DURATION.fast, ease: EASE },
    base: { duration: DURATION.base, ease: EASE },
    slow: { duration: DURATION.slow, ease: EASE },
} as const

/** The same speeds for CSS transitions, so both engines agree. */
export const TRANSITION = {
    fast: `transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-[120ms] ${EASE_CSS}`,
    base: `transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ${EASE_CSS}`,
} as const

/** For indicators that slide between positions — the nav underline, segmented pills. */
export const GLIDE = { type: 'spring' as const, stiffness: 520, damping: 44, mass: 0.7 }

/** Bars and rings fill critically damped: no overshoot on a measurement. */
export const FILL = { type: 'spring' as const, stiffness: 180, damping: 30 }

/**
 * The completion pop. A tween with back-out easing, not a spring: Framer allows
 * only two keyframes under a spring, and a 1 → 1.12 → 1 bounce is three.
 */
export const POP = { duration: 0.28, times: [0, 0.4, 1], ease: [0.34, 1.56, 0.64, 1] as const }

/** Entrance for a page's sections, staggered by index. */
export const REVEAL_STAGGER = 0.045

// ─── Surfaces ────────────────────────────────────────────────────────────────

/** 1px separator. */
export const HAIRLINE = 'border-black/[0.07] dark:border-white/[0.07]'

/** The same weight for `divide-*`. */
export const DIVIDE = 'divide-black/[0.06] dark:divide-white/[0.06]'

/** A card. Elevation is a hairline and the faintest shadow — never a drop shadow. */
export const CARD = `bg-card border ${HAIRLINE} shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none`

/** Floating layers: menus, dialogs, panels. */
export const FLOAT = `bg-popover border ${HAIRLINE} shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18),0_4px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)]`

/** Row hover. It should register without flashing. */
export const HOVER = 'hover:bg-black/[0.025] dark:hover:bg-white/[0.03]'

/** Focus ring, consistent everywhere. Keyboard only. */
export const FOCUS =
    'outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 focus-visible:ring-offset-background'

/** Focus for text fields: the border warms and a soft halo appears. */
export const FIELD_FOCUS =
    'outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/12 dark:focus:ring-primary/20'

// ─── Radii ───────────────────────────────────────────────────────────────────

export const R = {
    /** Checkboxes, heatmap cells, tiny marks. */
    sm: 'rounded-[6px]',
    /** Buttons, inputs, rows — the default. */
    md: 'rounded-[8px]',
    /** Cards. */
    lg: 'rounded-[12px]',
    /** Dialogs and panels. */
    xl: 'rounded-[16px]',
} as const

// ─── Type ────────────────────────────────────────────────────────────────────
// Tracking tightens as size grows and opens on small caps.

export const T = {
    /** Page title. */
    display: 'text-[24px] font-semibold leading-[1.2] tracking-[-0.025em]',
    /** A big figure in a stat. */
    figure: 'text-[22px] font-semibold leading-none tracking-[-0.03em] tabular-nums',
    /** Card and dialog headings. */
    title: 'text-[14px] font-semibold leading-[1.35] tracking-[-0.01em]',
    /** Default reading size. */
    body: 'text-[13px] leading-[1.5]',
    /** Interactive labels. */
    button: 'text-[13px] font-medium leading-none',
    /** Secondary text, metadata. */
    meta: 'text-[12px] leading-[1.4]',
    /** Column headers, tiny figures. */
    caption: 'text-[11px] font-medium leading-[1.3]',
} as const

/** Any figure that sits in a column and must align. */
export const NUM = 'tabular-nums'

/** Text hierarchy, four steps. */
export const INK = {
    strong: 'text-foreground',
    default: 'text-foreground/80',
    muted: 'text-muted-foreground',
    subtle: 'text-muted-foreground/65',
} as const

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const ICON = {
    /** Inline with small text. */
    sm: 'h-3 w-3',
    /** The default — leading icons in rows and buttons. */
    md: 'h-3.5 w-3.5',
    /** Anything that heads a section. */
    lg: 'h-4 w-4',
} as const

/** Page gutter and width, shared by the header and every page. */
export const PAGE = 'mx-auto w-full max-w-[1040px] px-4 sm:px-8'

// ─── Colour ──────────────────────────────────────────────────────────────────

/** The one accent. */
export const DONE = {
    fill: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    stroke: 'stroke-emerald-500',
} as const

/** The one warning. */
export const BEHIND = {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
} as const
