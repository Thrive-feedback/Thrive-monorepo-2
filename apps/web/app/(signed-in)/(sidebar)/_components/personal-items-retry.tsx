'use client';

import { useRouter } from 'next/navigation';
import { PersonalItemsPageFailed } from './personal-items-page-failed';

/** A list whose first page could not be read: the title stays, with a way to try again. */
export function PersonalItemsRetry() {
  const router = useRouter();

  return <PersonalItemsPageFailed onRetry={() => router.refresh()} />;
}
