import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readFeatureFlags } from '@/lib/feature-flags/feature-flags.service';
import { ROUTES } from '@/lib/routes.constant';
import { isSignedIn } from '@/lib/session/signed-in.service';
import { SITE_NAME } from '@/lib/site.constant';
import { HrLanding } from './_components/hr-landing/hr-landing';
import { HR_LANDING_COPY } from './_components/hr-landing/hr-landing-copy.constant';
import { Landing } from './_components/landing/landing';
import { LANDING_COPY } from './_components/landing/landing-copy.constant';
import { LandingStructuredData } from './_components/landing-structured-data';

/**
 * The title is absolute, skipping the layout's "· Thrive" template, since it already leads with
 * the name. Indexable: this is the page someone searching for Thrive should find. Its canonical
 * address and its previews' are paths, written out on the site's address by the root layout; the
 * preview image is `opengraph-image.tsx` beside this file, which still shows the page for teams'
 * promise while the front page for HR is behind its flag. Which page's words it carries follows
 * the same flag as the page itself (ADR 0087, brain `ADR-0061`).
 */
export async function generateMetadata(): Promise<Metadata> {
  const { showsHrLanding } = await readFeatureFlags();
  const { title, description } = showsHrLanding
    ? HR_LANDING_COPY.meta
    : LANDING_COPY.meta;
  return {
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
}

/**
 * Rendered per request, because it reads the request's cookies and what the deployment has
 * switched on. Someone signed in has Home and goes there, which sends them on if they have no
 * Workspace yet. With the HR flag on, this is the front page for HR and the page for teams moves to
 * `/for-teams`, each linking to the other; with it off, or when the API cannot say, it is the page
 * for teams as it always was, with no switch. The session is asked for only when a session cookie
 * is present, and a failed or slow flag read is off, so the page stays up while the API is down.
 *
 * Both pages are one route while the flag lives, so the page for teams' client code (its desk,
 * board and postcards) is loaded with the page for HR too, which needs none of it. That is the
 * flag's cost, paid until it goes and the two become routes of their own.
 */
export default async function LandingPage() {
  const [signedIn, { showsHrLanding }] = await Promise.all([
    isSignedIn(),
    readFeatureFlags(),
  ]);
  if (signedIn) {
    redirect(ROUTES.home);
  }
  const { description } = showsHrLanding
    ? HR_LANDING_COPY.meta
    : LANDING_COPY.meta;
  return (
    <>
      <LandingStructuredData description={description} />
      {showsHrLanding ? <HrLanding /> : <Landing />}
    </>
  );
}
