# Visual Improvements Guide - Database Blocks

## 🎨 Notion-Style Design System

### Color Palette
```
Background:     bg-background
Muted:          bg-muted/20, bg-muted/30
Border:         border-border/40
Accent:         bg-accent/30, bg-accent/50
Text:           text-foreground
Muted Text:     text-muted-foreground
```

### Spacing System
```
Tight:          gap-1, gap-1.5, gap-2
Normal:         gap-2, gap-3, gap-4
Loose:          gap-4, gap-6
```

### Border Radius
```
Small:          rounded-md (6px)
Medium:         rounded-lg (8px)
Large:          rounded-xl (12px)
```

---

## 📊 Database Block Components

### 1. Header Design

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Title]  [3 items]        [View ▼] [New] [⋯]          │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `bg-muted/30`
- Border: `border-b border-border/40`
- Padding: `px-3 py-2.5`
- Height: Compact (auto)

**Elements:**
- Title: `text-sm font-semibold`
- Count: `text-xs text-muted-foreground`
- Buttons: `h-6 text-xs`

---

### 2. Table View Design

**Structure:**
```
┌──────────────────────────────────────────────────────────┐
│  📄 NAME              │ STATUS        │ ...              │
├──────────────────────────────────────────────────────────┤
│  📄 Item 1            │ Not started   │ ...              │ ← bg-background
│  📄 Item 2            │ In progress   │ ...              │ ← bg-muted/10
│  📄 Item 3            │ Done          │ ...              │ ← bg-background
│  + New                                                    │
└──────────────────────────────────────────────────────────┘
```

**Header Row:**
- Background: `bg-muted/20`
- Text: `text-xs uppercase tracking-wide`
- Color: `text-muted-foreground`
- Padding: `py-2 px-3`

**Data Rows:**
- Alternating: `bg-background` / `bg-muted/10`
- Hover: `hover:bg-accent/30`
- Border: `border-b border-border/30`
- Padding: `py-2 px-3`

**Name Column:**
- Width: `w-[280px]`
- Icon: `text-base` (emoji)
- Text: `font-medium`
- Expand icon: `opacity-0 group-hover:opacity-50`

---

### 3. Board View Design

**Structure:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ● Not start │  │ ● In prog   │  │ ● Done      │
│    [2]      │  │    [1]      │  │    [3]      │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
│ │ 📄 Item │ │  │ │ 📄 Item │ │  │ │ 📄 Item │ │
│ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │
│ ┌─────────┐ │  │             │  │ ┌─────────┐ │
│ │ 📄 Item │ │  │             │  │ │ 📄 Item │ │
│ └─────────┘ │  │             │  │ └─────────┘ │
│ + New       │  │ + New       │  │ + New       │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Column:**
- Width: `w-72` (288px)
- Background: `bg-muted/20`
- Border radius: `rounded-lg`
- Padding: `p-2`

**Column Header:**
- Padding: `px-3 py-2.5`
- Border: `border-b border-border/30`
- Dot: `w-2 h-2 rounded-full`
- Count: `text-xs bg-muted px-1.5 py-0.5 rounded`

**Card:**
- Background: `bg-background`
- Border: `border border-border/40`
- Hover: `hover:shadow-md hover:border-border`
- Padding: `p-3`
- Spacing: `space-y-2`

---

### 4. Gallery View Design

**Structure:**
```
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│ 📄   │  │ 📄   │  │ 📄   │  │ 📄   │
│      │  │      │  │      │  │      │
│ Item │  │ Item │  │ Item │  │ Item │
└──────┘  └──────┘  └──────┘  └──────┘
```

**Grid:**
- Columns: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Gap: `gap-4`
- Padding: `p-4`

**Card:**
- Aspect ratio: `aspect-video`
- Background: `bg-muted`
- Border: `border border-border`
- Hover: `hover:shadow-md`

---

### 5. List View Design

**Structure:**
```
┌─────────────────────────────────────────┐
│ 📄  Item 1                              │
│ 📄  Item 2                              │
│ 📄  Item 3                              │
│ + New                                   │
└─────────────────────────────────────────┘
```

**Row:**
- Padding: `px-4 py-2`
- Hover: `hover:bg-accent/50`
- Icon: `text-lg`
- Text: `text-sm`

---

## 🎯 Status Badge Design

**Colors:**
```typescript
gray:   bg-gray-100 text-gray-700 (Not started)
blue:   bg-blue-100 text-blue-700 (In progress)
green:  bg-green-100 text-green-700 (Done)
red:    bg-red-100 text-red-700 (Blocked)
yellow: bg-yellow-100 text-yellow-700 (Review)
```

**Styling:**
- Padding: `px-3 py-1`
- Border radius: `rounded-md`
- Font: `text-xs font-medium`
- Hover: `hover:opacity-80`

**Dropdown:**
- Dot indicator: `w-2.5 h-2.5 rounded-full`
- Selected: `bg-accent`

---

## 🎨 Hover States

### Table Row
```css
Default:  bg-background / bg-muted/10
Hover:    bg-accent/30
Active:   bg-accent/50
```

### Board Card
```css
Default:  border-border/40
Hover:    border-border + shadow-md
Active:   border-primary
```

### Button
```css
Default:  text-muted-foreground
Hover:    text-foreground + bg-accent/50
Active:   bg-accent
```

---

## 📐 Spacing Guidelines

### Database Block
```
Outer margin:     my-1
Border radius:    rounded-md
Shadow:           shadow-sm hover:shadow-md
```

### Header
```
Padding:          px-3 py-2.5
Gap:              gap-2
Border:           border-b border-border/40
```

### Content
```
Padding:          p-2 to p-4 (depends on view)
Min height:       min-h-[120px]
```

### Cards
```
Padding:          p-3
Gap:              gap-2
Border radius:    rounded-md
```

---

## 🎭 Animation & Transitions

### Hover Effects
```css
transition-shadow    /* For cards */
transition-colors    /* For buttons */
transition-all       /* For complex elements */
```

### Opacity Changes
```css
opacity-0 group-hover:opacity-50    /* Expand icon */
opacity-0 group-hover:opacity-100   /* Action buttons */
```

### Loading States
```css
animate-spin         /* Spinner */
animate-pulse        /* Skeleton */
```

---

## 🔤 Typography

### Headers
```
Database title:   text-sm font-semibold
Column headers:   text-xs uppercase tracking-wide
Section headers:  text-sm font-medium
```

### Content
```
Item names:       text-sm font-medium
Descriptions:     text-xs text-muted-foreground
Counts:           text-xs tabular-nums
```

### Buttons
```
Primary:          text-xs
Secondary:        text-xs text-muted-foreground
```

---

## 🎨 Dark Mode Support

All colors use Tailwind's dark mode variants:
```css
bg-background       /* Auto switches */
text-foreground     /* Auto switches */
border-border       /* Auto switches */
bg-muted            /* Auto switches */
```

**Custom dark mode:**
```css
dark:bg-gray-800
dark:text-gray-300
dark:border-gray-700
```

---

## 📱 Responsive Design

### Breakpoints
```
Mobile:   < 640px   (sm)
Tablet:   640-768px (md)
Desktop:  > 768px   (lg)
```

### Gallery Grid
```
Mobile:   grid-cols-2
Tablet:   grid-cols-3
Desktop:  grid-cols-4
```

### Board Columns
```
Mobile:   Horizontal scroll
Tablet:   Horizontal scroll
Desktop:  Horizontal scroll
```

---

## ✨ Polish Details

### Shadows
```
Subtle:   shadow-sm
Normal:   shadow-md
Strong:   shadow-lg
```

### Borders
```
Subtle:   border-border/30
Normal:   border-border/40
Strong:   border-border
```

### Backgrounds
```
Subtle:   bg-muted/10
Light:    bg-muted/20
Normal:   bg-muted/30
```

---

## 🎯 Accessibility

### Focus States
```css
focus:ring-0              /* Remove default ring */
focus:outline-none        /* Remove outline */
focus:bg-accent          /* Custom focus */
```

### Contrast
```
Text on background:  4.5:1 minimum
Text on muted:       3:1 minimum
```

### Interactive Elements
```
Min touch target:    44x44px
Min click target:    24x24px
```

---

## 🚀 Performance

### Optimizations
- Use `transition-*` for specific properties
- Avoid `transition-all` when possible
- Use `will-change` sparingly
- Lazy load images
- Virtual scrolling for long lists

---

**This design system ensures consistency across all database views!** 🎨
