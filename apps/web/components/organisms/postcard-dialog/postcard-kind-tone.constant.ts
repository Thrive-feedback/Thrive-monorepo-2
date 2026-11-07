import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import type { PostcardKind } from './postcard-draft.type';

/**
 * The colour of each kind of postcard, for the notes beside it as it is written or read: giving
 * Feedback in the brand's purple, and asking for it or answering one in the blue of everything asked
 * for, as their buttons and their cards in a list are.
 */
export const POSTCARD_KIND_TONES: Readonly<Record<PostcardKind, FeedCardTone>> =
  {
    give: 'primary',
    ask: 'tertiary',
    answer: 'tertiary',
  };
