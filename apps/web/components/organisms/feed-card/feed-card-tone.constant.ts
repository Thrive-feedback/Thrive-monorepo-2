import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';
import type { FeedCardTone } from './feed-card-tone.type';

/**
 * The ground of each kind of card, so a list or a grid can be told apart at a glance: the brand's
 * colour for Feedback given unasked, the cool one for anything asked for, the warm one for a Kudos.
 */
export const FEED_CARD_GROUND: Readonly<Record<FeedCardTone, string>> = {
  primary: 'bg-action-primary/8',
  tertiary: 'bg-action-tertiary/8',
  secondary: 'bg-action-secondary/8',
};

/**
 * The ink of each kind of card: its colour a shade darker, so words in it read on the card's tinted
 * ground. The word naming the kind and the note pointing at its card are both written in it.
 */
export const FEED_CARD_INK: Readonly<Record<FeedCardTone, string>> = {
  primary: 'text-action-primary-hover',
  tertiary: 'text-action-tertiary-hover',
  secondary: 'text-action-secondary-hover',
};

/** The edge of each kind of card where it is drawn as an outline, as in an empty list. */
export const FEED_CARD_EDGE: Readonly<Record<FeedCardTone, string>> = {
  primary: 'border-action-primary-border',
  tertiary: 'border-action-tertiary-border',
  secondary: 'border-action-secondary-border',
};

/** A piece of Feedback in its kind's colour: given unasked, or an answer to something asked. */
export const FEED_CARD_ORIGIN_TONES: Readonly<
  Record<HomeFeedItem['origin'], FeedCardTone>
> = {
  REQUESTED: 'tertiary',
  OFFERED: 'primary',
};
