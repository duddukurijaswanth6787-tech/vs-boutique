# VS Boutique ERP — Animation Guidelines

> **Current state:** 27 pages and 24 components use `framer-motion` with ad-hoc patterns. This document defines the standardized animation system going forward.

---

## Section 1: Animation Philosophy

### Purposeful, not decorative
Every animation must serve a clear UX purpose: guiding attention, providing feedback, or communicating state changes. If an animation does not improve usability or intelligibility, omit it.

### Performance first
- Animate **only** `transform` and `opacity` — these are GPU-composited properties that do not trigger layout or paint.
- Use `will-change: transform` on elements that will animate to create a new compositor layer.
- Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`, or `box-shadow` — these trigger expensive layout recalculations.

### Respect user preferences
Honour `prefers-reduced-motion` at every animation site. Users who report motion sensitivity must receive a static, non-animated experience.

### Consistent timing
All tween-based animations use a single cubic-bezier curve: `[0.16, 1, 0.3, 1]`. This curve is fast in, gentle out — it feels responsive without being jarring. Spring-based animations use predefined stiffness/damping pairs defined in the motion config.

### Reusable patterns, never one-offs
Do not write inline `motion.div` with ad-hoc `initial`/`animate` props. Every animation pattern must be encapsulated in a reusable component or pulled from the variants constants. This guarantees visual consistency and simplifies future changes.

---

## Section 2: Core Animation Library

All reusable animation components live in `core/components/animations/`. Each component accepts `children` and spreads additional `motion` props so consumers can override when necessary.

### 2.1 Entry Animations

| Component | Behaviour |
|---|---|
| `FadeIn` | Opacity `0 → 1` |
| `FadeUp` | Opacity `0 → 1` + `translateY(20px) → 0` |
| `FadeDown` | Opacity `0 → 1` + `translateY(-20px) → 0` |
| `FadeLeft` | Opacity `0 → 1` + `translateX(20px) → 0` |
| `FadeRight` | Opacity `0 → 1` + `translateX(-20px) → 0` |
| `Scale` | `scale(0.95) → scale(1)` with fade |
| `Zoom` | `scale(0) → scale(1)` with spring overshoot |

### 2.2 Emphasis Animations

| Component | Behaviour |
|---|---|
| `Rotate` | Configurable rotation (default `0 → 360`) |
| `Pulse` | Subtle scale oscillation (`1 → 1.05 → 1`) |
| `Bounce` | Vertical bounce, configurable height |
| `Floating` | Gentle y-axis hover float for hero elements |

### 2.3 Interactive Animations

| Component | Behaviour |
|---|---|
| `HoverCard` | Lifts element + deepens shadow on hover |
| `HoverButton` | Scales `1 → 1.02` + colour tint on hover |
| `Ripple` | Material-style radial ripple on click |

### 2.4 Status Animations

| Component | Behaviour |
|---|---|
| `SuccessAnimation` | Green checkmark with scale-in + ring burst |
| `ErrorAnimation` | Horizontal shake + red X mark |
| `LoadingAnimation` | SVG spinner with configurable speed |
| `SkeletonAnimation` | Shimmer sweep across skeleton placeholders |

### 2.5 Layout & Composite Animations

| Component | Behaviour |
|---|---|
| `RouteTransition` | Wraps page content; handles exit/enter with `AnimatePresence` |
| `PageTransition` | Lower-level route exit/enter variant set |
| `MotionWrapper` | Generic wrapper accepting a `variant` prop to pick any preset |
| `AnimatedList` | Staggers child entrance (`staggerChildren: 0.05`) |
| `AnimatedGrid` | Same stagger behaviour for CSS-grid children |
| `AnimatedModal` | Fade + scale backdrop and content on mount/unmount |
| `AnimatedDrawer` | Slides panel in from left/right/top/bottom |
| `AnimatedTooltip` | Fade + slight y-offset on visibility toggle |
| `AnimatedTabs` | Cross-fade panel content on tab switch |
| `AnimatedAccordion` | Animated `max-height` expand/collapse |
| `AnimatedCounter` | Increments a number from `0 → N` with easing |
| `AnimatedProgress` | Fills a progress bar with a smooth tween |

---

## Section 3: Motion Configuration Constants

Define in `core/config/motion.config.js`.

```js
// core/config/motion.config.js

export const TRANSITION = {
  default: {
    type: 'tween',
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1],
  },
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  springGentle: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
  springSnappy: {
    type: 'spring',
    stiffness: 400,
    damping: 35,
  },
  slow: {
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1],
  },
  fast: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  },
};

export const VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  fadeRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideLeft: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  slideRight: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
};
```

---

## Section 4: Usage Examples

### Page wrapper

```jsx
import { RouteTransition } from '@core/components/animations';

export default function BoutiquesPage() {
  return (
    <RouteTransition>
      <YourPageContent />
    </RouteTransition>
  );
}
```

### Staggered list

```jsx
import { AnimatedList } from '@core/components/animations';

export function ProductGrid({ products }) {
  return (
    <AnimatedList>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </AnimatedList>
  );
}
```

### Hover card

```jsx
import { HoverCard } from '@core/components/animations';

export function BoutiqueCard({ boutique }) {
  return (
    <HoverCard>
      <div className="p-6 bg-white rounded-xl">
        {/* card content */}
      </div>
    </HoverCard>
  );
}
```

### Modal

```jsx
import { AnimatedModal } from '@core/components/animations';

export function DeleteConfirmModal({ isOpen, onClose }) {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <ConfirmDialog />
    </AnimatedModal>
  );
}
```

### Accordion

```jsx
import { AnimatedAccordion } from '@core/components/animations';

export function FaqItem({ question, answer }) {
  return (
    <AnimatedAccordion title={question}>
      <p>{answer}</p>
    </AnimatedAccordion>
  );
}
```

---

## Section 5: Reduced Motion

Every animation component must check for `prefers-reduced-motion` using Framer Motion's built-in hook. When the user has signalled a preference for reduced motion, all variant values should return empty objects so the element renders immediately in its final state.

```jsx
// core/components/animations/FadeUp.jsx
import { motion, useReducedMotion } from 'framer-motion';
import { VARIANTS } from '@core/config/motion.config';

export function FadeUp({ children, ...props }) {
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : VARIANTS.fadeUp;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

**Rule:** If `useReducedMotion()` returns `true`, set `initial`, `animate`, and `exit` to empty objects (`{}`). Do not attempt to create "simplified" animations — a static render is the safest and most predictable outcome.

---

## Section 6: Migration from Current Ad-Hoc Usage

### What to find and replace

| Current pattern | Replace with |
|---|---|
| `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>` | `<FadeIn>` or variant constant |
| `<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>` | `<FadeUp>` |
| `<motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>` | `<Scale>` |
| `<AnimatePresence>` wrapping page content | `<RouteTransition>` |
| Inline `transition={{ type: 'spring', stiffness: ..., damping: ... }}` | `TRANSITION.spring` / `TRANSITION.springGentle` / `TRANSITION.springSnappy` |
| Inline `transition={{ duration: 0.3 }}` | `TRANSITION.default` |

### Step-by-step migration plan

1. **Install** the animation components package (or create the files under `core/components/animations/`).
2. **Create** `core/config/motion.config.js` with the constants from Section 3.
3. **Identify** all files in the codebase that import `motion` from `'framer-motion'`.
4. **Replace** page-level `motion.div` + `AnimatePresence` with `<RouteTransition>`.
5. **Replace** inline entry animations with the appropriate component (`FadeIn`, `FadeUp`, `FadeLeft`, etc.).
6. **Replace** inline spring/tween config references with the constants from `motion.config.js`.
7. **Verify** that every component uses `useReducedMotion` as shown in Section 5.
8. **Run** a visual regression pass to ensure nothing behaves differently.

### Enforcement

- All new PRs **must** use the animation components or the motion config constants. Inline variants and transitions will be rejected in code review.
- A barrel export at `core/components/animations/index.js` should re-export every animation component so consumers use a single import path.

---

## Appendix: Barrel Export

```js
// core/components/animations/index.js

export { FadeIn } from './FadeIn';
export { FadeUp } from './FadeUp';
export { FadeDown } from './FadeDown';
export { FadeLeft } from './FadeLeft';
export { FadeRight } from './FadeRight';
export { Scale } from './Scale';
export { Zoom } from './Zoom';
export { Rotate } from './Rotate';
export { Pulse } from './Pulse';
export { Bounce } from './Bounce';
export { Floating } from './Floating';
export { HoverCard } from './HoverCard';
export { HoverButton } from './HoverButton';
export { Ripple } from './Ripple';
export { SuccessAnimation } from './SuccessAnimation';
export { ErrorAnimation } from './ErrorAnimation';
export { LoadingAnimation } from './LoadingAnimation';
export { SkeletonAnimation } from './SkeletonAnimation';
export { RouteTransition } from './RouteTransition';
export { PageTransition } from './PageTransition';
export { MotionWrapper } from './MotionWrapper';
export { AnimatedList } from './AnimatedList';
export { AnimatedGrid } from './AnimatedGrid';
export { AnimatedModal } from './AnimatedModal';
export { AnimatedDrawer } from './AnimatedDrawer';
export { AnimatedTooltip } from './AnimatedTooltip';
export { AnimatedTabs } from './AnimatedTabs';
export { AnimatedAccordion } from './AnimatedAccordion';
export { AnimatedCounter } from './AnimatedCounter';
export { AnimatedProgress } from './AnimatedProgress';
```
