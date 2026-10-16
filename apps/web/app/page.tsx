import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes.constant';
import { readSession } from '@/lib/session/session.service';
import { hasSessionCookie } from '@/lib/session/session-cookie.constant';
import { Landing } from './_components/landing/landing';
import { LANDING_COPY } from './_components/landing/landing-copy.constant';

const { title, description } = LANDING_COPY.meta;

/**
 * The title is absolute, skipping the layout's "· Thrive" template, since it already leads with
 * the name. Indexable: this is the page a founder searching for Thrive should find.
 */
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: true, follow: true },
  openGraph: { title, description },
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
  return <Landing />;
}
