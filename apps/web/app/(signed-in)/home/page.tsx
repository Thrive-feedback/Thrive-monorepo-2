import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { MemberAndInvitationList } from './_components/member-and-invitation-list';
import { HomeSearchParams } from './_lib/home-search-params.schema';
import { ROLE_NAMES } from './_lib/role-names.constant';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

/**
 * Home of the person's Workspace, where a Member lands after signing in; `/` stays public
 * for the landing page. It names the Workspace, who the person is in it, and their teammates
 * — with the Invitations still open, for those who can invite. Nothing else of the product is
 * built yet.
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
        Home
      </Text>
      <ul className="flex flex-col gap-2">
        <li className="flex flex-wrap gap-x-2">
          <Text as="span" variant="subtitle-4">
            Workspace name:
          </Text>
          <Text as="span">{session.membership.workspace.name}</Text>
        </li>
        <li className="flex flex-wrap gap-x-2">
          <Text as="span" variant="subtitle-4">
            My email:
          </Text>
          <Text as="span" className="break-all">
            {session.email}
          </Text>
        </li>
        <li className="flex flex-wrap gap-x-2">
          <Text as="span" variant="subtitle-4">
            My role:
          </Text>
          <Text as="span">{ROLE_NAMES[session.membership.role]}</Text>
        </li>
      </ul>
      <section className="flex flex-col gap-2">
        <Text as="h2" variant="subtitle-4">
          My teammates
        </Text>
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <MemberAndInvitationList
            membership={session.membership}
            ownEmail={session.email}
          />
        </Suspense>
      </section>
    </div>
  );
}
