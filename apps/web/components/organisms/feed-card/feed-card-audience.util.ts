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
 * Who can read this piece. Kept to those it was written to is one person's only while it was written
 * to one: every Receiver of several reads it too.
 */
export function feedCardAudienceOf({
  visibility,
  receivers,
}: Pick<HomeFeedItem, 'visibility' | 'receivers'>) {
  const audience = AUDIENCES[visibility];
  return visibility === 'ONLY_ME' && receivers.length > 1
    ? { ...audience, label: "Only the people it's for" }
    : audience;
}
