import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { ROUTES } from '@/lib/routes.constant';
import { readSession } from '@/lib/session/session.service';
import { InvitationClosed } from './_components/invitation-closed';
import { InvitationHeading } from './_components/invitation-heading';
import { InvitationJoinForm } from './_components/invitation-join-form';
import { InvitationSignIn } from './_components/invitation-sign-in';
import { readInvitation } from './_lib/invitation.service';
import { InvitationParams } from './_lib/invitation-params.schema';
import { InvitationSearchParams } from './_lib/invitation-search-params.schema';

/** Reached only from an email, and personal to whoever received it. */
export const metadata: Metadata = {
  title: 'Invitation',
  robots: { index: false, follow: false },
};

type InvitationPageProps = {
  params: Promise<{ invitationId: string }>;
  /** `signedIn` is set when Google sent the person back here to accept. */
  searchParams: Promise<{ signedIn?: string | string[] }>;
};

/**
 * Where an Invitation's Accept link lands. It says first whether the Invitation still stands;
 * if it does, a signed-out person signs in with Google and comes back here, and a signed-in one
 * joins with one click.
 */
export default async function InvitationPage({
  params,
  searchParams,
}: InvitationPageProps) {
  const parsed = InvitationParams.safeParse(await params);
  if (!parsed.success) {
    notFound();
  }
  const { invitationId } = parsed.data;
  const { signedIn } = InvitationSearchParams.parse(await searchParams);
  const [invitation, account] = await Promise.all([
    readInvitation(invitationId),
    readSession(),
  ]);
  if (!invitation) {
    notFound();
  }

  if (invitation.status !== 'PENDING') {
    return (
      <InvitationClosed
        invitation={invitation}
        status={invitation.status}
        isSignedIn={account !== null}
      />
    );
  }
  if (!account) {
    return <InvitationSignIn invitation={invitation} />;
  }
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${account.email}`}
          then={ROUTES.invitation(invitationId)}
        />
      )}
      <InvitationHeading invitation={invitation} />
      <InvitationJoinForm invitation={invitation} email={account.email} />
    </div>
  );
}
