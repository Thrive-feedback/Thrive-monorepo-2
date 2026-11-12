import type { MetadataRoute } from 'next';
import { ROUTES } from '@/lib/routes.constant';
import { webUrl } from '@/lib/web-url.util';

/**
 * Every page that declares itself indexable, by its path in `ROUTES`. `sitemap.test.ts` reads
 * each page's own robots directive and fails when this list and the pages disagree, so a page made
 * indexable cannot be left out and one made private cannot stay in. No date is given, because
 * nothing records when a page last changed.
 */
export const INDEXABLE_ROUTES = [ROUTES.landing, ROUTES.signIn] as const;

/** Built at build time on the site's configured address. */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map((path) => ({
    url: new URL(path, webUrl()).href,
  }));
}
