import { ROUTES } from '@/lib/routes.constant';
import { SITE_NAME } from '@/lib/site.constant';
import { webUrl } from '@/lib/web-url.util';

/**
 * What the landing page is, for search engines: the site, the organization behind it and the web
 * app it describes, linked to each other by id. Every value is one the page or its metadata
 * already shows. There is no price, rating, review or count, because Thrive has none to show.
 * `description` is the one the page's own metadata carries, so the two never disagree.
 */
export function landingStructuredData(description: string) {
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
        description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'en',
        publisher: { '@id': organization },
      },
    ],
  };
}

export type LandingStructuredDataProps = {
  /** The description the page's metadata carries. */
  description: string;
};

/** The landing page's structured data, as JSON-LD in the server-rendered page. */
export function LandingStructuredData({
  description,
}: LandingStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: built here from constants, and `<` is escaped so no value can close the script.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(landingStructuredData(description)).replace(
          /</g,
          '\\u003c',
        ),
      }}
    />
  );
}
