import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * A missing backup font is invisible to a rendered test: jsdom lays nothing out, and Next.js
 * reports it only as a build-time log line. So this reads the two places that decide it — the
 * root layout's `Google_Sans` options and the backup face in the token layer — as text. The face is
 * hand-written in the token layer's supplement, because the generated files come from the design.
 */
const require = createRequire(join(__dirname, 'layout.test.ts'));
const layout = readFileSync(join(__dirname, 'layout.tsx'), 'utf8');
const supplement = readFileSync(
  require.resolve('@repo/tokens/supplement.css'),
  'utf8',
);

function fontFace(family: string): string | undefined {
  return supplement
    .split('@font-face')
    .slice(1)
    .find((block) => block.includes(`font-family: '${family}'`));
}

describe('the Google Sans backup font', () => {
  it('cannot come from Next.js, which has no measurements for Google Sans', () => {
    const {
      calculateSizeAdjustValues,
    } = require('next/dist/server/font-utils');
    // If this fails after a Next.js upgrade, Next.js can build the face itself: drop ours and
    // the layout's opt-out.
    expect(() => calculateSizeAdjustValues('Google Sans')).toThrow();
  });

  it('is named by the layout, so Next.js does not try to build one', () => {
    const options = layout.match(/Google_Sans\(\{([\s\S]*?)\}\)/)?.[1];
    expect(options).toMatch(/fallback:\s*\['Google Sans Fallback'\]/);
    expect(options).toMatch(/adjustFontFallback:\s*false/);
  });

  it('resizes Arial on every metric, so swapping in Google Sans moves nothing', () => {
    const face = fontFace('Google Sans Fallback');
    expect(face).toBeDefined();
    expect(face).toMatch(/src: local\('Arial'\);/);
    for (const descriptor of [
      'ascent-override',
      'descent-override',
      'line-gap-override',
      'size-adjust',
    ]) {
      expect(face).toMatch(new RegExp(`${descriptor}: \\d+(\\.\\d+)?%;`));
    }
  });
});
