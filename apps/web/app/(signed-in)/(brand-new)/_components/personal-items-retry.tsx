'use client';

import { useRouter } from 'next/navigation';
import { ReceivedPageFailed } from './received-page-failed';

/** Received when its first page could not be read: the title stays, with a way to try again. */
export function ReceivedItemsRetry() {
  const router = useRouter();

  return <ReceivedPageFailed onRetry={() => router.refresh()} />;
}
