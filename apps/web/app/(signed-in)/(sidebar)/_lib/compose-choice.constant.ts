/** What a person can choose to write, in the order it is offered: ask for Feedback, give it, or give a Kudos. */
export const COMPOSE_CHOICES = ['ask', 'give', 'kudos'] as const;

export type ComposeChoice = (typeof COMPOSE_CHOICES)[number];

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
