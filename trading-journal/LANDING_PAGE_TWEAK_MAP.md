# Landing Page Tweak Map

Quick reference guide for manually editing the new landing page sections.

---

## 1. COMPONENT OWNERSHIP (What Controls What)

| Section | Component File | Responsible For |
|---------|----------------|-----------------|
| Background dots | `src/components/BackgroundScene.tsx` | Reactive canvas animation |
| Hero + Terminal Intro | `src/components/HeroSection.tsx` | Headline, subheadline, terminal lines, hero buttons |
| Product Showcase Cards | `src/components/ProductShowcase.tsx` | 4 feature cards with titles, descriptions, metrics |
| Pricing/Free Reveal | `src/components/FreeReveal.tsx` | Pricing items, "Free" reveal, footnote |
| Page Composition | `src/pages/HomePage.tsx` | Orchestrates all sections together |
| All Styling | `src/App.css` | Spacing, colors, shadows, animations, responsive |

---

## 2. FILE-BY-FILE EDIT GUIDE

### 📄 `src/components/HeroSection.tsx`

**HERO HEADLINE** (Main title at top)
- **Location:** Line 46
- **Find/Replace:** 
  ```tsx
  <h1>Your Trading Journal.</h1>
  ```
- Replace the text between `<h1>` and `</h1>`

**HERO SUBHEADLINE** (Subtitle below headline)
- **Location:** Line 51
- **Find/Replace:**
  ```tsx
  <p className="hero-subheadline">
    ur journal. ur trades. ur journey. all in one space.
  </p>
  ```
- Replace text between opening and closing `<p>` tags

**TERMINAL INTRO STRINGS** (The 4 lines that appear on first load)
- **Location:** Lines 5-9 (the `INTRO_LINES` array)
- **Current strings:**
  ```tsx
  const INTRO_LINES = [
    'initializing journ workspace...',
    'loading trade analytics...',
    'connecting performance engine...',
    'ready',
  ];
  ```
- Edit individual strings in this array (each string is on its own line)
- Line 4 will display in green as the final "ready" state

**HERO BUTTONS**
- **Location:** Lines 67-71 (primary button - "Start Trading Free")
  ```tsx
  <Link to="/signup" className="hero-btn-primary">
    Start Trading Free
  </Link>
  ```
  Replace text between tags

- **Location:** Lines 72-75 (secondary button - "Sign In")
  ```tsx
  <Link to="/login" className="hero-btn-ghost">
    Sign In
  </Link>
  ```
  Replace text between tags

---

### 📄 `src/components/ProductShowcase.tsx`

**FEATURE CARDS** (4 trading cards below hero)
- **Location:** Lines 4-22 (the `showcaseItems` array)
- **Structure:** Each card has 4 editable properties:
  ```tsx
  {
    title: "Trade Tracking",          // Change card title
    description: "...",              // Change card description
    metrics: [                         // Change the 3 metric values
      "1,247 Trades",
      "52 Setups",
      "89% Win Rate"
    ],
    className: "showcase-trade-tracking-visual" // Don't change
  }
  ```

**Card 1 - Trade Tracking** (Top-left)
  - Title: Line 5
  - Description: Line 6
  - Metrics: Lines 7-11

**Card 2 - Performance Curve** (Top-right)
  - Title: Line 13
  - Description: Line 14
  - Metrics: Lines 15-19

**Card 3 - Pattern Review** (Bottom-left)
  - Title: Line 21
  - Description: Line 22
  - Metrics: Lines 23-27

**Card 4 - Discipline Meter** (Bottom-right)
  - Title: Line 29
  - Description: Line 30
  - Metrics: Lines 31-35

---

### 📄 `src/components/FreeReveal.tsx`

**FREE REVEAL HEADER** (Title above pricing)
- **Location:** Line 47
- **Find/Replace:**
  ```tsx
  <h2 className="reveal-title">Everything You Need is Included</h2>
  ```
- Replace text between `<h2>` tags

**FREE REVEAL SUBTITLE** (Supporting line)
- **Location:** Line 48
- **Find/Replace:**
  ```tsx
  <p>No gatekeeping. No feature tiers. No compromise.</p>
  ```
- Replace text in `<p>` tags

**PRICING ITEMS** (The 3 crossed-out prices)
- **Location:** Lines 52-63 (the pricing array)
- **Structure:**
  ```tsx
  const pricingItems = [
    { label: "Journal", cost: "$99" },
    { label: "Analytics", cost: "$149" },
    { label: "Performance Tracking", cost: "$79" }
  ];
  ```
- Edit `label` (feature name) or `cost` (strikethrough price)

**FREE REVEAL TEXT** (The big "Free" word)
- **Location:** Line 68
- **Find/Replace:**
  ```tsx
  <div className="free-text">Free</div>
  ```
- Replace "Free" with desired text (keep it short for layout)

**FREE REVEAL FOOTNOTE** (Small text under "Free")
- **Location:** Line 69
- **Find/Replace:**
  ```tsx
  <p className="reveal-footnote">
    No credit card. No trials. No limits. Forever.
  </p>
  ```
- Replace text in `<p>` tags

**FREE REVEAL BUTTONS**
- **Primary Button:** Line 72
  ```tsx
  <Link to="/signup" className="reveal-btn-primary">
    Create Your Free Account
  </Link>
  ```

- **Secondary Button:** Line 75
  ```tsx
  <Link to="/login" className="reveal-btn-ghost">
    Already trading? Sign In
  </Link>
  ```

---

### 📄 `src/App.css`

#### **BACKGROUND & GLOW**

**Hero Section Background**
- **Location:** Line ~2090 (`.hero-section`)
- **Glow Intensity:**
  ```css
  background: radial-gradient(
    400px at 50% 0%,
    rgba(58, 134, 168, 0.04),    /* Adjust opacity here (0.04 = subtle) */
    transparent
  );
  ```
  - Change `0.04` to higher value for stronger glow (try 0.06-0.10)

**Showcase Section Background**
- **Location:** Line ~2262 (`.showcase-section`)
- **Glow:**
  ```css
  background: linear-gradient(
    180deg,
    rgba(58, 134, 168, 0.02) 0%,  /* Opacity control */
    transparent
  );
  ```

**Free Reveal Section Background**
- **Location:** Line ~2498 (`.free-reveal-section`)
- **Glow:**
  ```css
  background: linear-gradient(
    180deg,
    rgba(18, 160, 108, 0.02) 0%,  /* Green glow opacity */
    transparent
  );
  ```

---

#### **TYPOGRAPHY SIZING**

**Hero Headline**
- **Location:** Line ~2125 (`.hero-headline`)
- **Scale Control:**
  ```css
  font-size: clamp(3rem, 6.5vw, 4.8rem);
  ```
  - `3rem` = minimum size on mobile
  - `6.5vw` = responsive, scales with viewport width
  - `4.8rem` = maximum size on large screens
  - Change `6.5vw` to `7vw` for larger scaling or `6vw` for smaller

**Hero Subheadline**
- **Location:** Line ~2139 (`.hero-subheadline`)
- **Scale Control:**
  ```css
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  ```

**Showcase Card Title**
- **Location:** Line ~2315 (`.card-title`)
- **Scale Control:**
  ```css
  font-size: clamp(1.1rem, 2.5vw, 1.35rem);
  ```

**Free Reveal Big Text**
- **Location:** Line ~2577 (`.free-text`)
- **Scale Control:**
  ```css
  font-size: clamp(3.2rem, 8vw, 5rem);
  ```

---

#### **ANIMATION TIMING**

**Terminal Intro Line Animation**
- **Location:** Line ~2247 (`.terminal-line`)
- **Duration Control:**
  ```css
  animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  ```
  - `0.6s` = duration of each line appearing
  - Longer = slower reveal, shorter = faster

**Scroll-triggered Section Reveals**
- **Location:** In component files (HeroSection.tsx, ProductShowcase.tsx, FreeReveal.tsx)
- **Values set in component `variants`:**
  - `duration: 0.7` = animation length (seconds)
  - `delay: 0.08` = delay between staggered items
  - `whileInView: {...}` = triggers when section scrolls into view

---

#### **SECTION SPACING**

**Hero Section Padding**
- **Location:** Line ~2095 (`.hero-section`)
- **Current:** `padding: 2rem 2rem 2.5rem;`
- Increase for more space, decrease for tighter layout

**Hero Inner Spacing**
- **Location:** Line ~2105 (`.hero-inner`)
- **Current:** `gap: 1.8rem;`
- Controls space between headline, subheadline, and buttons

**Showcase Section Padding**
- **Location:** Line ~2268 (`.showcase-section`)
- **Current:** `padding: 4.5rem 2rem;`
- First number = vertical (top/bottom), second = horizontal (left/right)

**Showcase Grid Gap**
- **Location:** Line ~2280 (`.showcase-container`)
- **Current:** `gap: 1.5rem;`
- Controls space between the 4 cards

**Free Reveal Section Padding**
- **Location:** Line ~2504 (`.free-reveal-section`)
- **Current:** `padding: 4.5rem 2rem;`

**Free Reveal Gap** (space between header, pricing, reveal)
- **Location:** Line ~2515 (`.free-reveal-container`)
- **Current:** `gap: 3rem;`

---

#### **BUTTON STYLING**

**Primary Button Base** (Blue gradient)
- **Location:** Line ~2158 (`.hero-btn-primary`)
- **Background:**
  ```css
  background: linear-gradient(120deg, var(--accent), #12a06c);
  ```
  - Gradient direction: `120deg`
  - Colors: `var(--accent)` (blue #3a86a8) to green (#12a06c)

- **Shadow:**
  ```css
  box-shadow: 0 6px 20px rgba(58, 134, 168, 0.18);
  ```
  - Increase opacity (last number) for darker shadow (try 0.20-0.24)
  - Increase `20px` for softer spread

**Primary Button Hover**
- **Location:** Line ~2171 (`.hero-btn-primary:hover`)
- **Shadow on hover:**
  ```css
  box-shadow: 0 8px 28px rgba(58, 134, 168, 0.24);
  ```

**Ghost Button** (Link-style, no fill)
- **Location:** Line ~2176 (`.hero-btn-ghost`)
- **Border:**
  ```css
  border: 1.5px solid var(--line);
  ```
- Change `1.5px` to thicker (2px) or thinner (1px)

---

#### **COLOR REFERENCES** (CSS Variables)

Located at top of `src/App.css`, these control the overall palette:
- `--ink`: #e6eeea (light text, default)
- `--muted`: #9baca4 (secondary text, dimmed)
- `--line`: #2a3733 (borders, dividers)
- `--panel`: #182126 (dark backgrounds)
- `--accent`: #3a86a8 (blue, primary)
- `--positive`: #12a06c (green, success)

To change a color globally, find the variable definition and edit hex value.

---

#### **MOBILE BREAKPOINTS**

**Mobile Styles** (screens smaller than 640px)
- **Location:** Line ~2431 (`@media (max-width: 640px)`)
- Controls padding, font sizing, and layout on phones

**Tablet Styles** (screens smaller than 1024px)
- **Location:** Line ~2565 (`@media (max-width: 1024px)`)
- Adjusts showcase grid and spacing for tablets

To make typography larger on mobile, increase `clamp` values within these blocks.

---

## 3. QUICK COPY INDEX (Find-Replace Shortcuts)

| What to Change | File | Search String | Line ~|
|---|---|---|---|
| Main headline | HeroSection.tsx | "Your Trading Journal." | 46 |
| Subheadline | HeroSection.tsx | "ur journal. ur trades. ur journey." | 51 |
| Terminal line 1 | HeroSection.tsx | "initializing journ workspace..." | 6 |
| Terminal line 2 | HeroSection.tsx | "loading trade analytics..." | 7 |
| Terminal line 3 | HeroSection.tsx | "connecting performance engine..." | 8 |
| Terminal line 4 | HeroSection.tsx | "ready" | 9 |
| Hero primary btn | HeroSection.tsx | "Start Trading Free" | 70 |
| Hero secondary btn | HeroSection.tsx | "Sign In" | 74 |
| Card 1 title | ProductShowcase.tsx | "Trade Tracking" | 5 |
| Card 2 title | ProductShowcase.tsx | "Performance Curve" | 13 |
| Card 3 title | ProductShowcase.tsx | "Pattern Review" | 21 |
| Card 4 title | ProductShowcase.tsx | "Discipline Meter" | 29 |
| Reveal header | FreeReveal.tsx | "Everything You Need is Included" | 47 |
| Reveal subtitle | FreeReveal.tsx | "No gatekeeping..." | 48 |
| Free big text | FreeReveal.tsx | "Free" | 68 |
| Free footnote | FreeReveal.tsx | "No credit card. No trials..." | 69 |
| Reveal primary btn | FreeReveal.tsx | "Create Your Free Account" | 72 |
| Reveal secondary btn | FreeReveal.tsx | "Already trading? Sign In" | 75 |

---

## 4. COMMON TWEAKING SCENARIOS

**Make the page feel MORE spacious:**
- Increase `.showcase-section` padding from `4.5rem` to `5.5rem`
- Increase `.free-reveal-container` gap from `3rem` to `4rem`
- Increase `.hero-inner` gap from `1.8rem` to `2.2rem`

**Make the page feel MORE dense/compact:**
- Decrease all padding values by 0.5rem
- Decrease all gap values by 0.3rem
- Reduce `clamp()` max values (e.g., `4.8rem` → `4.2rem`)

**Strengthen the glow effect:**
- Hero: Change `0.04` to `0.08` in radial-gradient
- Showcase: Change `0.02` to `0.05`
- Free Reveal: Change `0.02` to `0.06`

**Darken/lighten shadows on buttons:**
- Find button `.box-shadow` lines
- Increase last opacity value for darker shadows (0.18 → 0.24)
- Decrease for lighter shadows (0.18 → 0.12)

**Speed up animations:**
- In component files, find `duration: 0.7` and change to `0.5` (or lower)
- In `.hero-intro` animation, change `0.6s` to `0.4s`

**Slow down animations:**
- Increase duration values and animation speeds

---

## 5. FILE LOCATIONS (Full Paths)

```
src/components/
├── HeroSection.tsx          (Hero headline, subheadline, buttons, terminal intro)
├── ProductShowcase.tsx      (4 feature cards)
├── FreeReveal.tsx          (Pricing reveal, "Free" text, buttons)
├── BackgroundScene.tsx     (Animated background dots - do not edit)
└── HomePage.tsx            (Page composition - minimal)

src/App.css                 (All styling, spacing, colors, animations)
```

---

## 6. INSTANT EDITS CHECKLIST

Copy/paste this checklist to verify your tweaks:

- [ ] Hero headline updated? (HeroSection.tsx line 46)
- [ ] Subheadline updated? (HeroSection.tsx line 51)
- [ ] Terminal lines updated? (HeroSection.tsx lines 6-9)
- [ ] Feature card copy updated? (ProductShowcase.tsx lines 4-35)
- [ ] Reveal header/footnote updated? (FreeReveal.tsx lines 47-69)
- [ ] Button labels updated? (All 3 component files)
- [ ] Spacing values tweaked? (App.css section padding/gap)
- [ ] Colors/shadows adjusted? (App.css button styling)
- [ ] Animation timing changed? (Component `duration` values if needed)

Save all files and test in browser. No build step needed for CSS changes.

