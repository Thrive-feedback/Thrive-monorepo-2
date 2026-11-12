import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes.constant';
import { readSession } from '@/lib/session/session.service';
import { hasSessionCookie } from '@/lib/session/session-cookie.constant';
import { SITE_NAME } from '@/lib/site.constant';
import { Landing } from './_components/landing/landing';
import { LANDING_COPY } from './_components/landing/landing-copy.constant';
import { LandingStructuredData } from './_components/landing-structured-data';

const { title, description } = LANDING_COPY.meta;

/**
 * The title is absolute, skipping the layout's "· Thrive" template, since it already leads with
 * the name. Indexable: this is the page a founder searching for Thrive should find. Its canonical
 * address and its previews' are paths, written out on the site's address by the root layout; the
 * preview image is `opengraph-image.tsx` beside this file.
 */
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: ROUTES.landing },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: ROUTES.landing,
    siteName: SITE_NAME,
    title,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
};

/**
 * Rendered per request, because it reads the request's cookies. Someone signed in has Home and
 * goes there, which sends them on if they have no Workspace yet. The API is asked only when a
 * session cookie is present, so a visitor without one is answered without it, and the page
 * stays up while the API is down.
 */
export default async function LandingPage() {
  if (hasSessionCookie(await cookies()) && (await readSession())) {
    redirect(ROUTES.home);
  }
  return (
    <>
      <LandingStructuredData />
      <Landing />
    </>
  );
}
