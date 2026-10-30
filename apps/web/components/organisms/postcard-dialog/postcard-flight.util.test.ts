import { afterEach, describe, expect, it } from 'vitest';
import {
  type Curve,
  curvePath,
  parseDuration,
  parseEasing,
  postmarkPoint,
  readMotionSteps,
  sampleCurve,
} from './postcard-flight.util';

describe('parseDuration', () => {
  it('reads milliseconds and seconds as seconds', () => {
    expect(parseDuration('250ms')).toBe(0.25);
    expect(parseDuration(' 0.4s ')).toBe(0.4);
  });

  it('reads anything else as no time at all', () => {
    expect(parseDuration('')).toBe(0);
    expect(parseDuration('fast')).toBe(0);
  });
});

describe('parseEasing', () => {
  it("reads a cubic Bézier as Motion's four numbers", () => {
    expect(parseEasing('cubic-bezier(0.22, 1, 0.36, 1)')).toEqual([
      0.22, 1, 0.36, 1,
    ]);
  });

  it("reads a keyword by Motion's name for it", () => {
    expect(parseEasing('ease-in-out')).toBe('easeInOut');
    expect(parseEasing('ease-out')).toBe('easeOut');
    expect(parseEasing('linear')).toBe('linear');
  });

  it('falls back to linear for what it cannot read', () => {
    expect(parseEasing('cubic-bezier(0.22, 1, 0.36)')).toBe('linear');
    expect(parseEasing('steps(4)')).toBe('linear');
    expect(parseEasing('')).toBe('linear');
  });
});

describe('readMotionSteps', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reads the steps off the page', () => {
    const element = document.createElement('div');
    element.style.setProperty('--motion-duration-fast', '250ms');
    element.style.setProperty(
      '--motion-ease-bounce',
      'cubic-bezier(0.34, 1.36, 0.64, 1)',
    );
    element.style.setProperty('--motion-scale-large', '0.96');
    document.body.append(element);

    const steps = readMotionSteps(element);

    expect(steps.duration.fast).toBe(0.25);
    expect(steps.ease.bounce).toEqual([0.34, 1.36, 0.64, 1]);
    expect(steps.pressScale).toBe(0.96);
  });

  it('takes no time, and presses nothing, where no tokens are loaded', () => {
    const element = document.createElement('div');
    document.body.append(element);

    const steps = readMotionSteps(element);

    expect(steps.duration.verySlow).toBe(0);
    expect(steps.ease.inOut).toBe('linear');
    expect(steps.pressScale).toBe(1);
  });
});

describe('postmarkPoint', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function cardWith(markup: string) {
    const card = document.createElement('div');
    card.innerHTML = markup;
    document.body.append(card);
    return card;
  }

  it('comes down in the corner a stamp is put in when the side showing has none', () => {
    const card = cardWith(
      '<section></section><section inert><div data-stamp></div></section>',
    );

    expect(postmarkPoint(card)).toEqual({ x: 90, y: 15 });
  });

  it('comes down on the first stamp on the side showing', () => {
    const card = cardWith(
      '<section><div data-stamp></div><div data-stamp></div></section>',
    );
    const [first] = card.querySelectorAll('[data-stamp]');
    // jsdom lays nothing out, so the card and its stamp are given their places.
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    if (first) {
      first.getBoundingClientRect = () => new DOMRect(150, 10, 40, 40);
    }

    expect(postmarkPoint(card)).toEqual({ x: 85, y: 30 });
  });
});

const CURVE: Curve = [
  { x: 0, y: 0 },
  { x: 0, y: 100 },
  { x: 100, y: 100 },
  { x: 100, y: 0 },
];

describe('sampleCurve', () => {
  it('starts and ends where the curve does', () => {
    const points = sampleCurve(CURVE, 5);

    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[4]).toEqual({ x: 100, y: 0 });
  });

  it('passes through the middle of a symmetric curve halfway', () => {
    expect(sampleCurve(CURVE, 3)[1]).toEqual({ x: 50, y: 75 });
  });

  it('spaces the points along it by the ease it is given', () => {
    const lingering = sampleCurve(CURVE, 3, (progress) => progress ** 2);

    expect(lingering[1]?.x).toBeLessThan(50);
  });
});

describe('curvePath', () => {
  it('writes the curve as one SVG cubic', () => {
    expect(curvePath(CURVE)).toBe('M 0 0 C 0 100, 100 100, 100 0');
  });
});
