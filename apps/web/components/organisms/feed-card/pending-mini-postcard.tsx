'use client';

import { useLinkStatus } from 'next/link';
import {
  MiniPostcard,
  type MiniPostcardProps,
} from '@/components/molecules/mini-postcard';

export type PendingMiniPostcardProps = Omit<MiniPostcardProps, 'isPending'>;

/**
 * The small postcard inside the link that opens the real one, marked as on its way until it is
 * there. The link can only tell from inside it, which is why this is its own client component.
 */
export function PendingMiniPostcard(props: PendingMiniPostcardProps) {
  const { pending } = useLinkStatus();

  return <MiniPostcard {...props} isPending={pending} />;
}
