'use client';

import { toast } from 'sonner';
import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';

/** Client-only for the press. The showcase has no feed to read again, so it only says so. */
export function FeedPageFailedDemo() {
  return (
    <FeedPageFailed onRetry={() => toast('The page would be read again.')} />
  );
}
