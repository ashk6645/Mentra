# Design System Implementation

## Overview

This design system is inspired by the UX psychology principles of Todoist, Microsoft To Do, and ClickUp. The goal is to create a **calm, trustworthy, and emotionally safe** task management experience.

## Core Philosophy

### 1. Cognitive Ease
Users shouldn't think about the UI. Everything should feel intuitive and predictable.

### 2. Emotional Safety
The app reduces anxiety rather than creating it. No aggressive colors, no forced urgency.

### 3. Daily Habits
Low friction + satisfying feedback = users return daily.

## Color System

### Light Mode
- **Background**: `#FFFFFF` - Pure white for clarity
- **Foreground**: `#1A1A1A` - Not pure black (softer on eyes)
- **Primary**: `#2563EB` - Calm blue (trust, not aggressive)
- **Success**: `#059669` - Green for completion dopamine
- **Warning**: `#D97706` - Amber for gentle urgency
- **Destructive**: `#DC2626` - Red reserved for danger only

### Dark Mode
- **Background**: `#0A0A0A` - Not pure black (easier on OLED)
- **Foreground**: `#FAFAFA` - Not pure white (softer)
- **Primary**: `#3B82F6` - Slightly brighter for dark backgrounds
- **Success**: `#10B981` - Vibrant green
- **Warning**: `#F59E0B` - Bright amber
- **Destructive**: `#EF4444` - Clear red

### Why These Colors?
- **Blue Primary**: Universally trusted (banks, social networks use blue)
- **Green Success**: Triggers dopamine on task completion
- **Amber Warning**: Gentle urgency without panic
- **Red Destructive**: Reserved for actual danger to prevent habituation

## Typography Scale

Based on readability research and hierarchy needs:

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 32px | 700 | Page titles only |
| Heading | 20px | 600 | Section headers |
| Body Large | 16px | 500 | Task titles, primary buttons |
| Body | 14px | 400 | Descriptions, metadata |
| Small | 12px | 400 | Timestamps, tags |
| Mono | 14px | 400 | Time, counters, shortcuts |

### Font Stack
```css
-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Inter', system-ui, sans-serif
```
**Why:** Native fonts load instantly, feel familiar, and support accessibility.

## Spacing System (8px Grid)

All spacing follows an 8px base unit:

- `xs`: 4px - Tight grouping
- `sm`: 8px - List item spacing
- `md`: 16px - Card padding
- `lg`: 24px - Section gaps
- `xl`: 32px - Page margins
- `2xl`: 48px - Major sections
- `3xl`: 64px - Page-level spacing

**Why 8px?** Scales perfectly across devices (8, 16, 24, 32, 64) and aligns with iOS/Android native spacing.

## Animation System

### Timing Scale
- **Instant** (0ms): Color changes, text updates
- **Snappy** (100ms): Hover states, toggles
- **Quick** (200ms): Most transitions, dropdowns
- **Moderate** (300ms): Modals, sidebars
- **Slow** (500ms): Page transitions (rare)

### Easing Functions
- `ease-out`: Default (feels responsive)
- `ease-in`: Quick exits
- `ease-in-out`: Smooth both directions

### Key Animations

#### Task Completion
```css
.task-completed {
  text-decoration: line-through;
  opacity: 0.5;
  transition: all 200ms ease-out;
}
```

#### Checkbox Check
- Check mark draws in: 150ms
- Subtle scale to 1.1 then back to 1.0 (playful bounce)
- Background color transition: 100ms

#### Hover States
- Background lighten 3% (light mode) or 5% (dark mode)
- Border strengthens from subtle to default
- Duration: 200ms ease-out

#### Active/Press States
- Background darkens 15%
- Scale: 0.98 (subtle "press down")
- Duration: 100ms ease-in

## Interaction Rules

### Focus States (Accessibility Critical)
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: calc(var(--radius) + 2px);
}
```

**Never remove focus styles** - 15% of users navigate by keyboard.

### Touch Targets
- **WCAG Minimum**: 44x44px
- **Our Standard**: 48x48px (more forgiving)
- All buttons meet this standard

### Hover Behavior
- Subtle invitation, not aggressive highlight
- No layout shift (no scale on hover)
- Cursor changes to pointer for all clickable elements

## Component Patterns

### Buttons
```tsx
// Primary action (default)
<Button>Complete Task</Button>

// Success (completion)
<Button variant="success">Mark Done</Button>

// Destructive (danger)
<Button variant="destructive">Delete Task</Button>

// Ghost (progressive disclosure)
<Button variant="ghost">More Options</Button>
```

### Task Cards
- **Padding**: 16px (md spacing)
- **Border Radius**: 8px (friendly, not childish)
- **Hover**: Subtle shadow increase + border strengthen
- **Completion**: 50% opacity + strikethrough (200ms transition)

### Inputs
- **Height**: 48px (touch target)
- **Padding**: 16px horizontal
- **Focus**: 2px outline with 2px offset
- **Placeholder**: Tertiary color (not too faint)

### Cards
- **Border Radius**: 8px
- **Padding**: 24px vertical
- **Shadow**: Subtle, increases on hover
- **Transition**: 200ms quick

## Accessibility Standards

### Contrast Ratios
- **Normal Text**: 4.5:1 minimum (WCAG AA)
- **Large Text**: 3.0:1 minimum
- **Our Goal**: 7.0:1 where possible (AAA)

### Keyboard Navigation
All interactive elements must be:
- Reachable by Tab
- Activatable by Enter/Space
- Have visible focus indicators

### Screen Reader Support
- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- `aria-label` for icon-only buttons
- `aria-live` for dynamic updates

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## UX Psychology Principles

### Progressive Disclosure
**Rule**: Show minimal by default, power features hide until needed.

**Example**: Task card shows title + date. Labels, priority, comments hide behind one click.

### Spatial Consistency
**Rule**: Everything has a predictable home. Navigation never moves.

**Example**: Add button always in the same place. Brain stops hunting, enters flow state.

### Cognitive Chunking
**Rule**: Group by project/date, not endless scrolling.

**Example**: "Today" separated from "Upcoming" = mental compartmentalization.

### Temporal Anchoring
**Rule**: "Today" is the most powerful mental model.

**Example**: Humans think "what's happening today?" not "what's in my database?"

### Trust Through Reliability
**Rule**: App must load instantly (<500ms), never lose data, sync invisibly.

**Example**: Optimistic UI - show action immediately, sync in background.

### Respect Attention
**Rule**: No modals unless critical. No auto-tutorials after first use.

**Example**: Settings hidden but discoverable. No popups mid-task.

## Common Mistakes to Avoid

❌ **Feature vomit on homepage**
- Don't show all features at once
- Default to minimal view

❌ **Fake urgency through color**
- No red badges everywhere
- Use red only for actual danger

❌ **Blank canvas paralysis**
- Always show obvious first action
- Empty states have friendly guidance

❌ **No celebration of completion**
- Task completion needs visual feedback
- Subtle animation + optional confetti

❌ **Interruption addiction**
- No constant notifications
- No "are you sure?" for every action

## Usage Examples

### Creating a Task Card
```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

<Card className="hover:shadow-md transition-quick">
  <CardContent>
    <div className="flex items-start gap-3">
      <Checkbox />
      <div className="flex-1">
        <h3 className="text-base font-medium">Task Title</h3>
        <p className="text-sm text-secondary">Description</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Using Design System Constants
```tsx
import { spacing, duration, getTransition } from "@/lib/design-system"

// Get spacing
const cardPadding = spacing.md // "1rem" (16px)

// Get transition
const hoverTransition = getTransition("all", "quick", "out")
// Returns: "all 200ms cubic-bezier(0, 0, 0.2, 1)"
```

### Applying Animation
```tsx
// Quick hover effect
className="transition-quick hover:bg-accent"

// Task completion
className={cn(
  "transition-quick",
  isCompleted && "line-through opacity-50"
)}
```

## Testing Your Changes

1. **Visual Regression**: Check in both light and dark mode
2. **Keyboard Navigation**: Tab through all elements
3. **Screen Reader**: Use VoiceOver (Mac) or NVDA (Windows)
4. **Reduced Motion**: Test with system preference enabled
5. **Touch Targets**: Verify 48px minimum on mobile

## Files Modified

- `src/app/globals.css` - Core design tokens and utilities
- `src/lib/design-system.ts` - Programmatic constants and helpers
- `src/components/ui/button.tsx` - Updated button styles
- `src/components/ui/input.tsx` - Updated input styles
- `src/components/ui/card.tsx` - Updated card styles
- `src/components/ui/checkbox.tsx` - Updated checkbox with animation
- `src/components/tasks/task-card.tsx` - Applied design system

## Next Steps

1. Update remaining components (dialogs, dropdowns, badges)
2. Create empty state illustrations (simple, friendly)
3. Add optional confetti effect for task completion
4. Implement keyboard shortcuts (Cmd+K for quick add)
5. Add loading skeletons for perceived performance
6. Create onboarding for first-time users (skippable)

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Motion](https://material.io/design/motion/)
- [Todoist Design Philosophy](https://todoist.com/inspiration/design-philosophy)

---

**Remember**: The best design is invisible. Users should accomplish their tasks without thinking about the UI.
