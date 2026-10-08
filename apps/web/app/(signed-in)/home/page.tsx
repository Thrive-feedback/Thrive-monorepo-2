import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import type { MemberRole } from '@/lib/session/current-account.type';
import { requireMember } from '@/lib/session/session.service';
import { HomeSearchParams } from './_lib/home-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

/** How a Role reads on screen, in the glossary's words. */
const ROLE_NAMES: Readonly<Record<MemberRole, string>> = { OWNER: 'Owner' };

/**
 * Home of the person's Workspace, where a Member lands after signing in; `/` stays public
 * for the landing page. It names the Workspace and the person's Role in it, and is
 * otherwise still empty of product: nothing is built ahead of the first real feature.
 *
 * Every class resolves to a token: a role for colour, shape and type, a scale for spacing.
 * `bg-primary-500` is not a class that exists, because the theme exposes colour only as roles.
 */
type HomeProps = {
  /** `signedIn` is set when Google sent a returning person back here. */
  searchParams: Promise<{ signedIn?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { signedIn } = HomeSearchParams.parse(await searchParams);
  const session = await requireMember(signedIn);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then={ROUTES.home}
        />
      )}
      <Text variant="display-5" as="h1">
        {session.membership.workspace.name}
      </Text>
      <Text>You&rsquo;re the {ROLE_NAMES[session.membership.role]}</Text>
      <Text tone="muted">Ask for, give and act on feedback.</Text>
      <Button asChild variant="primary" size="sm" className="w-fit">
        <Link href={ROUTES.uiShowcase.index}>See the components</Link>
      </Button>
    </div>
  );
}
