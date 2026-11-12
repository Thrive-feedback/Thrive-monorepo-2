import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

/**
 * Every page under `app/` whose own metadata declares it indexable, as the URL path it serves:
 * route groups leave the URL, and `app/page.tsx` is `/`.
 */
function indexablePages(): string[] {
  return readdirSync(__dirname, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('page.tsx'))
    .filter((file) =>
      /robots:\s*\{\s*index:\s*true/.test(
        readFileSync(join(__dirname, file), 'utf8'),
      ),
    )
    .map((file) => {
      const segments = file
        .split(/[\\/]/)
        .slice(0, -1)
        .filter((segment) => !/^\(.*\)$/.test(segment));
      return `/${segments.join('/')}`;
    })
    .sort();
}

describe('sitemap', () => {
  it('lists every page that declares itself indexable, and nothing else', () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);

    expect(paths.sort()).toEqual(indexablePages());
  });

  it('writes each one out on the site’s configured address', () => {
    for (const entry of sitemap()) {
      expect(new URL(entry.url).origin).toBe('https://thrive.test');
    }
  });
});
