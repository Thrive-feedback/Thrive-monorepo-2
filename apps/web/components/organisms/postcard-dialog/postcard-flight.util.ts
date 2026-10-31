import type { Easing } from 'motion/react';

export type Point = { x: number; y: number };

/** A cubic Bézier curve: where it starts, its two pulls, and where it ends. */
export type Curve = readonly [Point, Point, Point, Point];

/** The motion steps a send uses, read from the `--motion-*` tokens. */
export type MotionSteps = {
  /** Each duration step, in seconds, as Motion takes it. */
  duration: {
    quick: number;
    fast: number;
    medium: number;
    slow: number;
    verySlow: number;
  };
  ease: { linear: Easing; inOut: Easing; out: Easing; bounce: Easing };
  /** How far the card gives under the postmark, as a scale factor. */
  pressScale: number;
};

/** The CSS easing keywords the tokens use, in Motion's own names. */
const KEYWORD_EASINGS: Readonly<Record<string, Easing>> = {
  linear: 'linear',
  ease: 'easeInOut',
  'ease-in': 'easeIn',
  'ease-out': 'easeOut',
  'ease-in-out': 'easeInOut',
};

/** `250ms` or `0.25s` in seconds; anything unreadable is 0, so the step happens at once. */
export function parseDuration(value: string): number {
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return trimmed.endsWith('ms') ? amount / 1000 : amount;
}

/** `cubic-bezier(a, b, c, d)` as Motion's four numbers, a keyword as its name, else linear. */
export function parseEasing(value: string): Easing {
  const trimmed = value.trim();
  const bezier = /^cubic-bezier\(([^)]*)\)$/.exec(trimmed);
  if (bezier?.[1]) {
    const [x1, y1, x2, y2, ...rest] = bezier[1]
      .split(',')
      .map((part) => Number.parseFloat(part));
    if (
      x1 !== undefined &&
      y1 !== undefined &&
      x2 !== undefined &&
      y2 !== undefined &&
      rest.length === 0 &&
      [x1, y1, x2, y2].every(Number.isFinite)
    ) {
      return [x1, y1, x2, y2];
    }
  }
  return KEYWORD_EASINGS[trimmed] ?? 'linear';
}

/**
 * The motion scale from `supplement.css`, read off the page as the card is sent, so every step
 * of the flight is a token step and nothing here is a number of milliseconds.
 */
export function readMotionSteps(element: Element): MotionSteps {
  const style = getComputedStyle(element);
  const duration = (step: string) =>
    parseDuration(style.getPropertyValue(`--motion-duration-${step}`));
  const ease = (step: string) =>
    parseEasing(style.getPropertyValue(`--motion-ease-${step}`));
  const pressScale = Number.parseFloat(
    style.getPropertyValue('--motion-scale-large'),
  );
  return {
    duration: {
      quick: duration('quick'),
      fast: duration('fast'),
      medium: duration('medium'),
      slow: duration('slow'),
      verySlow: duration('very-slow'),
    },
    ease: {
      linear: ease('linear'),
      inOut: ease('in-out'),
      out: ease('out'),
      bounce: ease('bounce'),
    },
    pressScale: Number.isFinite(pressScale) ? pressScale : 1,
  };
}

/** The middle of an element, from the top-left corner of `origin`. */
export function centerWithin(origin: Element, element: Element): Point {
  const outer = origin.getBoundingClientRect();
  const inner = element.getBoundingClientRect();
  return {
    x: inner.left - outer.left + inner.width / 2,
    y: inner.top - outer.top + inner.height / 2,
  };
}

/**
 * `count` points along the curve, both ends included, for keyframes evenly spaced in time. `ease`
 * spaces them along the curve, so a flight played linearly still eases as a whole, where an
 * easing per keyframe would stutter at every point.
 */
export function sampleCurve(
  [p0, p1, p2, p3]: Curve,
  count: number,
  ease: (progress: number) => number = (progress) => progress,
): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const t = ease(count > 1 ? index / (count - 1) : 0);
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    };
  });
}

/** The curve as an SVG path, in the pixels it was measured in. */
export function curvePath([p0, p1, p2, p3]: Curve): string {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}
