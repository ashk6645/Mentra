# Mentra Landing Page

## Overview
A premium, conversion-focused landing page for Mentra - the calm productivity app.

## Access
- **URL**: `/landing`
- **Root redirect**: Non-authenticated users are redirected to `/landing`

## Structure

### Sections (in order)
1. **Hero** - Main value proposition with animated demo
2. **Social Proof** - Trust indicators
3. **Problem** - Empathy moment (why existing tools fail)
4. **How It Works** - 4 mental modes (Capture, Execute, Plan, Reflect)
5. **Feature Showcase** - Interactive tabbed demo
6. **Differentiation** - Comparison with Notion/Todoist
7. **Testimonials** - Real user stories
8. **Pricing** - Free & Pro tiers
9. **Final CTA** - Last conversion opportunity
10. **Footer** - Links and legal

## Components

All components are in `src/components/landing/`:

- `hero-section.tsx` - Above-the-fold impact
- `social-proof.tsx` - Trust strip
- `problem-section.tsx` - Problem/solution narrative
- `how-it-works-section.tsx` - 4 modes grid
- `feature-showcase.tsx` - Tabbed feature demo
- `differentiation-section.tsx` - Comparison table
- `testimonials-section.tsx` - User quotes
- `pricing-section.tsx` - Pricing cards
- `final-cta.tsx` - Bottom conversion
- `landing-footer.tsx` - Footer links

## Design Principles

### Typography
- **Headlines**: 56px light (300) with semibold accents
- **Subheadlines**: 20px regular with 1.6 line-height
- **Body**: 16px with 1.7 line-height

### Colors
- **Primary**: #2563EB (Trust blue)
- **Success**: #059669 (Emerald)
- **Background**: #FAFAF9 (Warm stone)
- **Text**: #1C1917 (Deep stone)

### Spacing
- **Section padding**: 120px vertical (py-32)
- **Container max-width**: 1200px
- **Grid gap**: 48px

### Animations
- **Scroll reveal**: Fade up, 0.6s ease-out
- **Hover lift**: translateY(-4px), 0.2s
- **Stagger delay**: 0.1s per item

## Key Features

### 1. Animated Hero
- Floating app screenshot
- Animated cursor completing tasks
- Smooth scroll to "How It Works"

### 2. Interactive Feature Showcase
- Tabbed interface
- Smooth transitions between features
- Visual demos for each feature

### 3. Honest Differentiation
- Clear comparison table
- No aggressive positioning
- Explains when to use competitors

### 4. Conversion-Focused CTAs
- "Start with a clear mind" (not "Sign up")
- "Try Mentra free" (not "Get started")
- Multiple conversion points

## Copy Strategy

### Emotional Benefits
- **Clarity** - "Your mind, organized"
- **Calm** - "Doesn't overwhelm you"
- **Control** - "Build momentum"

### Differentiation
- Notion = Canvas (too flexible)
- Todoist = System (too complex)
- Mentra = Guide (just right)

### Micro-copy
- Buttons focus on outcomes, not actions
- Error messages are friendly
- Success messages are encouraging

## Performance

### Targets
- **LCP**: < 1.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Lighthouse**: 95+

### Optimizations
- Framer Motion for smooth animations
- Lazy loading for below-fold content
- Optimized images and gradients
- Minimal JavaScript

## Responsive Design

### Mobile (< 768px)
- Single column layouts
- Larger touch targets (48px)
- Simplified navigation
- Bottom sheet modals

### Tablet (768px - 1024px)
- Two column layouts
- Adaptive spacing
- Collapsible sections

### Desktop (> 1024px)
- Full multi-column layouts
- Rich interactions
- Generous whitespace

## Accessibility

- **WCAG 2.1 AA** compliant
- **Keyboard navigation** for all CTAs
- **Screen reader** optimized
- **Focus indicators** visible
- **Reduced motion** support

## Testing Checklist

- [ ] All sections render correctly
- [ ] Animations are smooth
- [ ] CTAs link to correct pages
- [ ] Responsive on all breakpoints
- [ ] Dark mode works (if enabled)
- [ ] Accessibility passes
- [ ] Performance targets met
- [ ] Copy is typo-free

## Future Enhancements

### Phase 2
- [ ] Video demo embed
- [ ] Live product tour
- [ ] Interactive calculator
- [ ] Customer logos
- [ ] Case studies

### Phase 3
- [ ] A/B testing framework
- [ ] Personalized CTAs
- [ ] Exit intent popup
- [ ] Chat widget
- [ ] Analytics tracking

## Conversion Funnel

1. **Awareness** - Hero + Problem sections
2. **Interest** - How It Works + Features
3. **Consideration** - Differentiation + Testimonials
4. **Decision** - Pricing + Final CTA
5. **Action** - Sign up flow

## Analytics Events to Track

- Hero CTA click
- Scroll depth (25%, 50%, 75%, 100%)
- Feature tab interactions
- Pricing card clicks
- Final CTA click
- Footer link clicks

## Content Updates

To update copy, edit the respective component files:
- Headlines: Component files
- Features: `feature-showcase.tsx`
- Testimonials: `testimonials-section.tsx`
- Pricing: `pricing-section.tsx`

## Launch Checklist

- [ ] All links work
- [ ] Forms submit correctly
- [ ] Images are optimized
- [ ] Meta tags are set
- [ ] OG images are added
- [ ] Analytics is configured
- [ ] Error tracking is set up
- [ ] Performance is optimized

---

**Built with intention. Designed for conversion.**
