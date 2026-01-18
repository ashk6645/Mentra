/**
 * Design System Constants
 * 
 * Based on UX psychology principles from Todoist, Microsoft To Do, and ClickUp
 * Purpose: Create calm, trustworthy, and emotionally safe UI
 */

// ==================== SPACING SCALE (8px grid) ====================
export const spacing = {
  xs: '0.25rem',   // 4px - tight grouping, icon padding
  sm: '0.5rem',    // 8px - list item vertical spacing
  md: '1rem',      // 16px - card padding, section gaps
  lg: '1.5rem',    // 24px - major section separation
  xl: '2rem',      // 32px - page margins
  '2xl': '3rem',   // 48px - hero sections
  '3xl': '4rem',   // 64px - page-level spacing
} as const;

// ==================== TYPOGRAPHY SYSTEM ====================
export const typography = {
  display: {
    size: '2rem',        // 32px
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    usage: 'Page titles only (Dashboard, Projects, Today)',
  },
  heading: {
    size: '1.25rem',     // 20px
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
    usage: 'Section headers, dialog titles',
  },
  bodyLarge: {
    size: '1rem',        // 16px
    weight: 500,
    lineHeight: 1.5,
    usage: 'Task titles, primary buttons',
  },
  body: {
    size: '0.875rem',    // 14px
    weight: 400,
    lineHeight: 1.6,
    usage: 'Task descriptions, secondary text, metadata',
  },
  small: {
    size: '0.75rem',     // 12px
    weight: 400,
    lineHeight: 1.5,
    usage: 'Timestamps, tags, subtle metadata',
  },
  mono: {
    size: '0.875rem',    // 14px
    family: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
    usage: 'Time displays, counters, keyboard shortcuts',
  },
} as const;

// ==================== COLOR PSYCHOLOGY ====================
export const colorPurpose = {
  primary: {
    value: '#2563EB',
    purpose: 'Blue = trust, calm action (banks, social networks)',
    usage: 'Primary actions, links, focus states',
  },
  success: {
    value: '#059669',
    purpose: 'Green = dopamine trigger for completion',
    usage: 'Task completion, success messages',
  },
  warning: {
    value: '#D97706',
    purpose: 'Amber = gentle urgency, not panic',
    usage: 'Warnings that need attention but not critical',
  },
  destructive: {
    value: '#DC2626',
    purpose: 'Red = reserved for danger only, prevents habituation',
    usage: 'Destructive actions (delete, remove)',
  },
} as const;

// ==================== ANIMATION TIMINGS ====================
export const duration = {
  instant: 0,          // Color changes, text updates
  snappy: 100,         // Hover states, simple toggles
  quick: 200,          // Most transitions, dropdowns
  moderate: 300,       // Modals, sidebars
  slow: 500,           // Page transitions (rare)
} as const;

export const easing = {
  out: 'cubic-bezier(0, 0, 0.2, 1)',        // Feels responsive
  in: 'cubic-bezier(0.4, 0, 1, 1)',         // Quick exits
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',    // Smooth both ways
} as const;

// ==================== INTERACTION RULES ====================
export const interactions = {
  hover: {
    duration: duration.quick,
    easing: easing.out,
    lighten: '3%',  // Light mode
    darken: '5%',   // Dark mode
  },
  active: {
    duration: duration.snappy,
    easing: easing.in,
    scale: 0.98,
    darken: '15%',
  },
  focus: {
    outlineWidth: '2px',
    outlineOffset: '2px',
    borderRadius: 'calc(var(--radius) + 2px)',
  },
} as const;

// ==================== ACCESSIBILITY STANDARDS ====================
export const accessibility = {
  minTouchTarget: 44,    // WCAG minimum (pixels)
  ourStandard: 48,       // More forgiving
  contrastRatio: {
    normalText: 4.5,     // WCAG AA
    largeText: 3.0,      // WCAG AA
    ourGoal: 7.0,        // WCAG AAA where possible
  },
} as const;

// ==================== BORDER RADIUS PHILOSOPHY ====================
export const borderRadius = {
  default: '0.5rem',     // 8px - friendly, approachable
  sm: '0.375rem',        // 6px - small elements
  lg: '0.75rem',         // 12px - cards
  full: '9999px',        // Pills, avatars
  reasoning: 'Soft corners = friendly. Sharp = corporate. Too round = childish.',
} as const;

// ==================== LAYOUT PATTERNS ====================
export const layout = {
  taskCard: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: borderRadius.default,
  },
  sidebar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  page: {
    marginHorizontal: spacing.xl,
    maxWidth: '1200px',
  },
  button: {
    paddingVertical: '0.75rem',
    paddingHorizontal: spacing.md,
    minHeight: `${accessibility.ourStandard}px`,
  },
} as const;

// ==================== UX PSYCHOLOGY PRINCIPLES ====================
export const uxPrinciples = {
  progressiveDisclosure: 'Show minimal by default, power features hide until needed',
  spatialConsistency: 'Everything has a predictable home, navigation never moves',
  cognitiveChunking: 'Group by project/date, not endless scrolling',
  temporalAnchoring: '"Today" is the most powerful mental model',
  trustThroughReliability: 'Must load <500ms, never lose data, sync invisibly',
  respectAttention: 'No modals unless critical, no auto-tutorials after first use',
} as const;

// ==================== COMMON PATTERNS ====================
export const patterns = {
  taskCompletion: {
    strikethrough: true,
    opacity: 0.5,
    duration: duration.quick,
    celebration: 'optional', // Confetti only if user enables
  },
  quickAdd: {
    alwaysAccessible: true,
    noModalRequired: true,
    keyboardShortcut: 'Cmd/Ctrl + K',
    friction: 'zero',
  },
  emptyStates: {
    tone: 'friendly, not corporate',
    illustration: 'simple, not childish',
    actionable: 'Clear next step always visible',
  },
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Get spacing value in rem
 */
export function getSpacing(size: keyof typeof spacing): string {
  return spacing[size];
}

/**
 * Get animation CSS string
 */
export function getTransition(
  property: string | string[],
  speed: keyof typeof duration = 'quick',
  easingType: keyof typeof easing = 'out'
): string {
  const props = Array.isArray(property) ? property.join(', ') : property;
  return `${props} ${duration[speed]}ms ${easing[easingType]}`;
}

/**
 * Check if element meets touch target size
 */
export function meetsTouchTarget(size: number): boolean {
  return size >= accessibility.minTouchTarget;
}

/**
 * Get focus ring style object
 */
export function getFocusStyle() {
  return {
    outline: `${interactions.focus.outlineWidth} solid var(--ring)`,
    outlineOffset: interactions.focus.outlineOffset,
    borderRadius: interactions.focus.borderRadius,
  };
}

// ==================== TYPE EXPORTS ====================
export type SpacingKey = keyof typeof spacing;
export type TypographyKey = keyof typeof typography;
export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
