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
 * The ink of each kind of card: its colour a shade darker, for the large handwriting beside it, the
 * note pointing at its card and the title of an empty list. The blue's fill is already that shade.
 */
export const FEED_CARD_INK: Readonly<Record<FeedCardTone, string>> = {
  primary: 'text-action-primary-hover',
  tertiary: 'text-action-tertiary',
  secondary: 'text-action-secondary-hover',
};

/**
 * The ink of the small word naming each kind, one step darker again (500) in every colour, so text that
 * small still reads at 4.5:1 on the card's tinted ground (WCAG AA).
 */
export const FEED_CARD_KIND_INK: Readonly<Record<FeedCardTone, string>> = {
  primary: 'text-action-primary-active',
  tertiary: 'text-action-tertiary',
  secondary: 'text-action-secondary-active',
};

/** Each kind's colour at full strength, for a mark as small as a dot that stands for it. */
export const FEED_CARD_FILL: Readonly<Record<FeedCardTone, string>> = {
  primary: 'bg-action-primary',
  tertiary: 'bg-action-tertiary',
  secondary: 'bg-action-secondary',
};

/**
 * Each kind's colour as the ground of a line while it is pointed at or focused, in place of a
 * menu's one highlight, so a line reads as the kind of thing it opens before it is pressed.
 */
export const FEED_CARD_HIGHLIGHT: Readonly<Record<FeedCardTone, string>> = {
  primary: 'data-highlighted:bg-action-primary-surface-hover',
  tertiary: 'data-highlighted:bg-action-tertiary-surface-hover',
  secondary: 'data-highlighted:bg-action-secondary-surface-hover',
};

/**
 * The same ground for a line that is a plain button or link rather than a menu's item, as in a
 * phone's drawer: while it is pointed at or focused from the keyboard.
 */
export const FEED_CARD_POINTED: Readonly<Record<FeedCardTone, string>> = {
  primary:
    'hover:bg-action-primary-surface-hover focus-visible:bg-action-primary-surface-hover',
  tertiary:
    'hover:bg-action-tertiary-surface-hover focus-visible:bg-action-tertiary-surface-hover',
  secondary:
    'hover:bg-action-secondary-surface-hover focus-visible:bg-action-secondary-surface-hover',
};

/**
 * Each kind's colour as a ring drawn around a mark, a gap away from it, for a mark that is waiting
 * on somebody: an unread line's dot. An outline, so the gap stays clear on any background.
 */
export const FEED_CARD_HALO: Readonly<Record<FeedCardTone, string>> = {
  primary: 'outline-2 outline-offset-2 outline-action-primary',
  tertiary: 'outline-2 outline-offset-2 outline-action-tertiary',
  secondary: 'outline-2 outline-offset-2 outline-action-secondary',
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
