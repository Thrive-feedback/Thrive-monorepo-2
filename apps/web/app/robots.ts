import type { MetadataRoute } from 'next';
import { webUrl } from '@/lib/web-url.util';

/**
 * Crawlers may read every page. A private page says `noindex` itself, which a crawler can only
 * see if it is let in, so none is disallowed here; only the sign-in callback the API answers is.
 * The sitemap's address is the site's configured one.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: new URL('/sitemap.xml', webUrl()).href,
  };
}
