import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Every route file named `page.tsx` under the showcase, as its path below this folder. */
function showcasePages(): string[] {
  return readdirSync(__dirname, { recursive: true, encoding: 'utf8' })
    .filter((file) => /(^|[\\/])page\.tsx$/.test(file))
    .sort();
}

describe('the UI showcase', () => {
  it('has pages to guard, so the check below cannot pass by finding none', () => {
    expect(showcasePages().length).toBeGreaterThan(0);
  });

  // The layout cannot be the guard: it is not run on every request that renders a page (ADR 0088).
  // A page added here without the call would be open to anybody, and nothing else would notice.
  it.each(showcasePages())('asks who is reading before %s renders', (page) => {
    expect(readFileSync(join(__dirname, page), 'utf8')).toMatch(
      /export default async function \w+\([^)]*\)\s*\{\s*await requireUiShowcaseAccess\(\);/,
    );
  });

  // Metadata is resolved for a page the reader is refused, and reaches the 404 they are sent.
  it.each(showcasePages())(
    'asks who is reading before %s names itself in metadata',
    (page) => {
      const source = readFileSync(join(__dirname, page), 'utf8');

      expect(source).not.toMatch(/export const metadata\b/);
      expect(source).toMatch(
        /export async function generateMetadata\([^)]*\)[^{]*\{\s*(\/\/[^\n]*\n\s*)*await requireUiShowcaseAccess\(\);/,
      );
    },
  );
});
