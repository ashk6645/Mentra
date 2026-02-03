This prompt is designed to:

* Keep scope **tight (V1)**
* Prevent AI from over-engineering
* Match your **MENTRA design language**
* Produce **clean, maintainable code**
* Avoid “AI-looking” UI

You can paste this **exactly as-is** into ChatGPT / Copilot / Cursor / Claude.

---

# 🧠 **MASTER PROMPT — MENTRA LANDING PAGE (V1)**

---

## ROLE & CONTEXT

> You are a **senior frontend engineer + product designer** who has built premium SaaS landing pages for companies like Linear, Superhuman, and Raycast.
>
> You are building the **V1 marketing landing page** for a productivity app called **MENTRA** — an AI-powered task and project manager with Notion-style pages.
>
> Your goal is **clarity, calm, and conversion**, not flashiness.

---

## TECH STACK (MANDATORY)

* Framework: **Next.js (App Router)**
* Styling: **Tailwind CSS**
* Animations: **Framer Motion**
* Images: **Next.js `<Image />`**
* Icons: **Lucide Icons**
* Font: **Inter** (or system font if unavailable)

---

## DESIGN PRINCIPLES (DO NOT VIOLATE)

* Premium, calm, minimal (Linear-like)
* No clutter, no stock photos
* Use **real product screenshots** only
* Large typography, generous spacing
* One primary CTA only
* Subtle animations (opacity + transform only)
* No heavy gradients everywhere
* No fake cursor animations
* No confetti, no gimmicks

---

## SCOPE — BUILD ONLY V1 (IMPORTANT)

### ✅ Build ONLY these sections:

1. **Sticky Navigation**
2. **Hero Section**
3. **Product Preview**
4. **Value Proposition (3 cards)**
5. **Feature Showcase (2–3 features max)**
6. **Light Social Proof**
7. **Final CTA**
8. **Footer**

❌ Do NOT build:

* Comparison tables
* Pricing tables
* Long FAQ sections
* Over-animated backgrounds
* Auto-playing videos

---

## PAGE STRUCTURE

### 1️⃣ Sticky Navigation

* Logo: “MENTRA”
* Right side:

  * Login (text button)
  * **Get Started Free** (primary button)
* Sticky with subtle blur on scroll
* Height ~64px

---

### 2️⃣ HERO SECTION (MOST IMPORTANT)

**Content**

* H1 (large, confident):

  > *Focus on what truly matters*
* Subtitle:

  > *The intelligent task manager that combines AI, projects, and Notion-style pages in one calm workspace.*
* CTAs:

  * Primary: **Get Started Free →**
  * Secondary: Watch Demo (outline, optional)
* Trust line below CTA:

  > No credit card required · Free forever

**Design**

* H1: 64–72px desktop, 48px mobile
* Gradient text ONLY on 1–2 words
* Background: white → light gray
* Plenty of whitespace

**Animation**

* Staggered fade-up on load
* Nav shrinks slightly on scroll

---

### 3️⃣ PRODUCT PREVIEW

**Purpose**
Show the real product UI immediately.

**Design**

* Browser-style frame (macOS dots)
* Inside: screenshot of Mentra Today view
* Max width: 1200px
* Soft shadow + subtle border
* Slight hover tilt (very minimal)

**Animation**

* Fade + slide up on scroll
* No looping animations

---

### 4️⃣ VALUE PROPOSITION (3 CARDS)

**Heading**

> *Why people switch to Mentra*

**Cards**

1. **AI That Actually Helps**
2. **Tasks + Pages Together**
3. **Designed for Focus**

**Card Design**

* White background
* Rounded-xl
* Soft shadow
* Hover lift (6–8px)

---

### 5️⃣ FEATURE SHOWCASE (2–3 ONLY)

Alternate layout:

* Image left / text right
* Then text left / image right

**Features to include**

1. Natural language task input
2. AI task breakdown
3. Notion-style pages

**Each feature**

* Title (32px)
* Short description
* 2–3 bullet points max
* Subtle screenshot hover scale

---

### 6️⃣ SOCIAL PROOF (LIGHT)

* Heading:

  > Loved by focused builders
* 2–3 testimonials max
* Use realistic but non-corporate roles
* No fake logos

---

### 7️⃣ FINAL CTA

* Background: very soft indigo/purple tint
* Heading:

  > Ready to focus?
* CTA:
  **Get Started Free**
* Subtext:

  > No credit card required

---

### 8️⃣ FOOTER

* Logo + short tagline
* Links:

  * Product
  * Company
  * Legal
* Dark background
* Simple, clean

---

## COLOR SYSTEM

```
Primary: Indigo-600
Accent: Purple-600
Text:
- Headings: Gray-900
- Body: Gray-700
- Muted: Gray-500
Backgrounds:
- White
- Gray-50
Footer:
- Gray-900
```

---

## ANIMATION RULES

* Use Framer Motion
* Opacity + translateY only
* 300–600ms duration
* Respect prefers-reduced-motion
* No parallax overload

---

## PERFORMANCE REQUIREMENTS

* Lighthouse score ≥ 90
* Lazy-load below fold
* Images in WebP
* No layout shifts
* No blocking scripts

---

## OUTPUT REQUIREMENTS

When responding:

1. Build **clean, readable, production-ready code**
2. Separate components by section
3. Use semantic HTML
4. Add helpful comments
5. Do NOT over-explain — focus on code
6. Ask questions ONLY if absolutely necessary

---

## FINAL INSTRUCTION

> Build this landing page as if it will ship to production tomorrow for a premium SaaS product.
> Prioritize **clarity, calm, and conversion** over visual tricks.

---

### END PROMPT

---

