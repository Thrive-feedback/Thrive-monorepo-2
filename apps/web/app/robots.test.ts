import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('lets every crawler read the site, so a private page’s own noindex is seen', () => {
    expect(robots().rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    });
  });

  it('points at the sitemap on the site’s configured address', () => {
    expect(robots().sitemap).toBe('https://thrive.test/sitemap.xml');
  });
});
