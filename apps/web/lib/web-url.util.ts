/**
 * Where this site is reached, from `WEB_URL`: its origin alone, such as `https://thriveteam.app`.
 * Canonical links, the sitemap, robots rules and social previews are absolute, so they are built on
 * it. More than one address can answer for the site, so it is configured rather than read from the
 * request: a search engine is told the one address, whichever it came in by.
 *
 * Next writes metadata, the sitemap and robots rules into the build, so a missing or malformed value
 * stops the build, naming the variable, rather than shipping links to nowhere.
 */
export function webUrl(): URL {
  const value = process.env.WEB_URL;
  if (!value) {
    throw new Error(
      'WEB_URL is not set. Copy apps/web/.env.example to apps/web/.env.',
    );
  }
  const url = URL.canParse(value) ? new URL(value) : null;
  if (
    !url ||
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `WEB_URL must be an origin alone, such as https://thriveteam.app; it is "${value}".`,
    );
  }
  return new URL(url.origin);
}
