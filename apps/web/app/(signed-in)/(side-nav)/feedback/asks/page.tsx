import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { WaitingAskList } from './_components/waiting-ask-list';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Waiting for me',
  robots: { index: false, follow: false },
};

/**
 * The requests for Feedback waiting on this person. Only their own: the API takes whose Asks
 * these are from the session, so there is no id in the URL to change.
 */
export default async function WaitingForMe() {
  const session = await requireMember();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Text variant="display-5" as="h1">
        Waiting for me
      </Text>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <WaitingAskList membership={session.membership} />
      </Suspense>
    </div>
  );
}
