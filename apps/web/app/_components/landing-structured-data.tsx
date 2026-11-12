import { ROUTES } from '@/lib/routes.constant';
import { SITE_NAME } from '@/lib/site.constant';
import { webUrl } from '@/lib/web-url.util';
import { LANDING_COPY } from './landing/landing-copy.constant';

/**
 * What the landing page is, for search engines: the site, the organization behind it and the web
 * app it describes, linked to each other by id. Every value is one the page or its metadata
 * already shows. There is no price, rating, review or count, because Thrive has none to show.
 */
export function landingStructuredData() {
  const home = new URL(ROUTES.landing, webUrl()).href;
  const organization = `${home}#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: SITE_NAME,
        url: home,
        logo: new URL('/apple-icon.png', home).href,
      },
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        name: SITE_NAME,
        url: home,
        inLanguage: 'en',
        publisher: { '@id': organization },
      },
      {
        '@type': 'WebApplication',
        '@id': `${home}#app`,
        name: SITE_NAME,
        url: home,
        description: LANDING_COPY.meta.description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'en',
        publisher: { '@id': organization },
      },
    ],
  };
}

/** The landing page's structured data, as JSON-LD in the server-rendered page. */
export function LandingStructuredData() {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: built here from constants, and `<` is escaped so no value can close the script.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(landingStructuredData()).replace(
          /</g,
          '\\u003c',
        ),
      }}
    />
  );
}
