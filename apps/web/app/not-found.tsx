import type { Metadata } from 'next';
import { OrbBackdrop } from '@/components/atoms/orb-backdrop';
import { Text } from '@/components/atoms/text';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { ROUTES } from '@/lib/routes.constant';
import { readSession } from '@/lib/session/session.service';
import {
  type NotFoundDestination,
  NotFoundEnvelope,
} from './_components/not-found/not-found-envelope';

export const metadata: Metadata = {
  title: 'Nothing lives here',
  robots: { index: false, follow: false },
};

/** Where a signed-in person can go instead: Home first, then the two places they read most. */
const MEMBER_DESTINATIONS = [
  { href: ROUTES.home, label: 'Take me Home' },
  { href: ROUTES.received, label: 'Received' },
  { href: ROUTES.kudos, label: 'Kudos board' },
] as const satisfies readonly [NotFoundDestination, ...NotFoundDestination[]];

/** Where anybody else can go instead: Thrive itself, or signing in. */
const VISITOR_DESTINATIONS = [
  { href: ROUTES.landing, label: 'Take me to Thrive' },
  { href: ROUTES.signIn, label: 'Sign in' },
] as const satisfies readonly [NotFoundDestination, ...NotFoundDestination[]];

/**
 * Whether someone is signed in, to offer them their own pages. A page that is already saying
 * "nothing here" must never fail on top of it, so a session it cannot read counts as signed out.
 */
async function isSignedIn(): Promise<boolean> {
  try {
    return (await readSession()) !== null;
  } catch {
    return false;
  }
}

/**
 * Every address nothing lives at, and every `notFound()` that reaches the root: the letter Thrive
 * could not deliver, to re-address to a real page. Only the root layout stands here, so it draws
 * its own ground, the signed-out orbs, and the wordmark back to the start.
 */
export default async function NotFound() {
  const signedIn = await isSignedIn();

  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-surface-base">
      <OrbBackdrop spread="screen" />
      <header className="px-inset-container pt-6">
        <NavbarLogo href={signedIn ? ROUTES.home : ROUTES.landing} />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 pt-8 pb-16 text-center">
        <div className="flex max-w-xl flex-col items-center gap-3">
          <Text as="h1" variant="display-4">
            No one lives at this address
          </Text>
          <Text variant="body-1" tone="muted">
            We couldn't deliver you to this page. The link may be old, or
            mistyped.
          </Text>
        </div>
        <NotFoundEnvelope
          destinations={signedIn ? MEMBER_DESTINATIONS : VISITOR_DESTINATIONS}
        />
      </main>
    </div>
  );
}
