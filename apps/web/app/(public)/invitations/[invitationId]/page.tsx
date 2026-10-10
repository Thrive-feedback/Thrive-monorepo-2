import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationComingSoon } from './_components/invitation-coming-soon';
import { InvitationParams } from './_lib/invitation-params.schema';

/** Reached only from an email, and personal to whoever received it. */
export const metadata: Metadata = {
  title: 'Invitation',
  robots: { index: false, follow: false },
};

type InvitationPageProps = {
  params: Promise<{ invitationId: string }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  if (!InvitationParams.safeParse(await params).success) {
    notFound();
  }
  return <InvitationComingSoon />;
}
