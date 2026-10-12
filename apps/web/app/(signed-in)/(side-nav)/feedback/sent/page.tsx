import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { SentRequestList } from './_components/sent-request-list';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'My requests',
  robots: { index: false, follow: false },
};

/**
 * What the person has asked for, and who has answered. Only their own: the API decides whose
 * requests these are from the session, so there is no id in the URL to change.
 */
export default async function MyRequests() {
  const session = await requireMember();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Text variant="display-5" as="h1">
        My requests
      </Text>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <SentRequestList membership={session.membership} />
      </Suspense>
    </div>
  );
}
