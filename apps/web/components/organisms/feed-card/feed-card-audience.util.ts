import { GlobeIcon, LockIcon, UsersIcon } from 'lucide-react';
import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';

/** Who can read a piece of Feedback, in the Visibility's own words, from the reader's side. */
const AUDIENCES: Readonly<
  Record<HomeFeedItem['visibility'], { label: string; Icon: typeof GlobeIcon }>
> = {
  EVERYONE: { label: 'Everyone in the Workspace', Icon: GlobeIcon },
  SELECTED_PEOPLE: { label: 'Selected people', Icon: UsersIcon },
  ONLY_ME: { label: 'Only me', Icon: LockIcon },
};

/**
 * Who can read this piece, from the reader's side. Kept to those it was written to is one person's
 * only while it was written to one: every Receiver of several reads it too, and its Giver, who wrote
 * it to somebody else, is not the "me" of Only me.
 */
export function feedCardAudienceOf(
  {
    visibility,
    giver,
    receivers,
  }: Pick<HomeFeedItem, 'visibility' | 'giver' | 'receivers'>,
  readerAccountId: string,
) {
  const audience = AUDIENCES[visibility];
  if (visibility !== 'ONLY_ME') {
    return audience;
  }
  if (giver.accountId === readerAccountId) {
    return { ...audience, label: 'Only them' };
  }
  return receivers.length > 1
    ? { ...audience, label: "Only the people it's for" }
    : audience;
}
