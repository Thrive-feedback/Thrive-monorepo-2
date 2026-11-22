import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';

/**
 * What a person can choose to write, in the order it is offered everywhere: give Feedback, ask for
 * it, or give a Kudos. The menu, the phone's sheet, Home's composer and the choices beside one
 * teammate all read this one order.
 */
export const COMPOSE_CHOICES = ['give', 'ask', 'kudos'] as const;

export type ComposeChoice = (typeof COMPOSE_CHOICES)[number];

/**
 * The colour of the card each choice writes, as the feed cards name it: asking in the blue of
 * everything asked for, giving in the brand's purple, a Kudos in the warm orange.
 */
export const COMPOSE_CHOICE_TONES: Readonly<
  Record<ComposeChoice, FeedCardTone>
> = {
  ask: 'tertiary',
  give: 'primary',
  kudos: 'secondary',
};

/** What "+" says it does, to a screen reader, and as the title of the phone's sheet of choices. */
export const WRITE_SOMETHING = 'Write something';

/** The line under each choice where "+" offers it, saying what it is for. */
export const COMPOSE_CHOICE_DESCRIPTIONS: Readonly<
  Record<ComposeChoice, string>
> = {
  ask: 'Ask teammates what they think.',
  give: "Tell a teammate what you've seen.",
  kudos: 'Say well done in a few words.',
};

/** What each choice is called wherever it is offered: the menu, Home's composer, an empty list. */
export const COMPOSE_CHOICE_TITLES: Readonly<Record<ComposeChoice, string>> = {
  ask: 'Ask for feedback',
  give: 'Give feedback',
  kudos: 'Give kudos',
};

/**
 * The button that offers each choice, filled in the colour of the card it writes: asking in the
 * blue of everything asked for, giving in the brand's purple, a Kudos in the warm orange.
 */
export const COMPOSE_CHOICE_BUTTONS: Readonly<
  Record<ComposeChoice, 'tertiary' | 'primary' | 'highlight'>
> = {
  ask: 'tertiary',
  give: 'primary',
  kudos: 'highlight',
};

/**
 * The quieter button for each choice, outlined in that choice's colour, for where all three sit side
 * by side, as in Home's composer, and a row of filled colours would shout.
 */
export const COMPOSE_CHOICE_OUTLINES: Readonly<
  Record<ComposeChoice, 'outlined-tertiary' | 'outlined' | 'outlined-highlight'>
> = {
  ask: 'outlined-tertiary',
  give: 'outlined',
  kudos: 'outlined-highlight',
};

/**
 * Each choice offered beside one teammate: its word on the button, and its whole name, which holds
 * the word and says who it is for.
 */
export const PERSON_COMPOSE_ACTIONS: Readonly<
  Record<ComposeChoice, { word: string; name: (who: string) => string }>
> = {
  give: { word: 'Give', name: (who) => `Give ${who} feedback` },
  ask: { word: 'Ask', name: (who) => `Ask ${who} for feedback` },
  kudos: { word: 'Kudos', name: (who) => `Give ${who} kudos` },
};
