'use client';

import { useLinkStatus } from 'next/link';
import {
  PostcardMiniature,
  type PostcardMiniatureProps,
} from './postcard-miniature';

export type PendingPostcardMiniatureProps = Omit<
  PostcardMiniatureProps,
  'isPending'
>;

/**
 * The postcard made small inside the link that opens it, marked as on its way until it is there.
 * The link can only tell from inside it, which is why this is its own client component.
 */
export function PendingPostcardMiniature(props: PendingPostcardMiniatureProps) {
  const { pending } = useLinkStatus();

  return <PostcardMiniature {...props} isPending={pending} />;
}
