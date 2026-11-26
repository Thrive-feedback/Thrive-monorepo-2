import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AudienceSwitch } from '@/app/_components/audience-switch';
import { Landing } from '@/app/_components/landing/landing';
import { LANDING_COPY } from '@/app/_components/landing/landing-copy.constant';
import { readFeatureFlags } from '@/lib/feature-flags/feature-flags.service';
import { ROUTES } from '@/lib/routes.constant';
import { isSignedIn } from '@/lib/session/signed-in.service';
import { SITE_NAME } from '@/lib/site.constant';

const { title, description } = LANDING_COPY.meta;

/**
 * Asks the flag too, so with it off the 404 carries no title, card or canonical of this page
 * (ADR 0087); the read is the one the page makes, shared by `cache`. Not indexed while the front
 * page for HR is behind its flag: with the flag off this address does not exist, so it stays out
 * of the sitemap, and the same words are indexed at `/` meanwhile. It becomes indexable when the
 * flag goes.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { showsHrLanding } = await readFeatureFlags();
  if (!showsHrLanding) {
    notFound();
  }
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: ROUTES.forTeams },
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      url: ROUTES.forTeams,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/**
 * The landing page for teams, at its own address once the front page is the one for HR (brain
 * `ADR-0061`), with the switch back to it. While the HR flag is off, or the API cannot say, the page
 * for teams is still the front page and this address answers a real 404. Someone signed in goes to
 * Home, as from the front page.
 */
export default async function ForTeamsPage() {
  const [signedIn, { showsHrLanding }] = await Promise.all([
    isSignedIn(),
    readFeatureFlags(),
  ]);
  if (!showsHrLanding) {
    notFound();
  }
  if (signedIn) {
    redirect(ROUTES.home);
  }
  return <Landing audienceSwitch={<AudienceSwitch current="teams" />} />;
}
