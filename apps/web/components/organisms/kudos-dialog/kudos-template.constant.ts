import type {
  CardInk,
  PostcardFont,
  PostcardTextStyle,
} from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { POSTCARD_INK_KEYS } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import styles from './kudos-card.module.css';

/** The templates in the order they are offered. Saved cards name these, so a key never changes. */
export const KUDOS_TEMPLATE_KEYS = [
  'cobalt-dash',
  'red-squiggle',
  'sunny-check',
  'peach-pop',
  'mint-breeze',
  'sky-note',
] as const;

export type KudosTemplateKey = (typeof KUDOS_TEMPLATE_KEYS)[number];

export type KudosInk = CardInk;

export type KudosTextStyle = PostcardTextStyle<KudosInk>;

export type KudosTemplate = {
  label: string;
  /** Draws the card; its border may also need `KudosCardBorder`. */
  className: string | undefined;
  /** The font and ink it comes with. Choosing it sets both, and the Giver can change them after. */
  font: PostcardFont;
  ink: KudosInk;
  /** The inks that can be read on it. */
  inks: readonly KudosInk[];
  /** The cursor and the placeholder, which have no drawn text to take a colour from. */
  fieldClassName: string;
};

const ON_A_LIGHT_CARD = 'caret-fg-primary placeholder:text-fg-secondary';

export const KUDOS_TEMPLATES: Readonly<
  Record<KudosTemplateKey, KudosTemplate>
> = {
  'cobalt-dash': {
    label: 'Cobalt Dash',
    className: styles.cobalt,
    font: 'signature',
    ink: 'paper',
    // Dark in the light theme and pale in the dark one, so only the paper's own colour reads on it.
    inks: ['paper'],
    fieldClassName: 'caret-surface-raised placeholder:text-surface-raised',
  },
  'red-squiggle': {
    label: 'Red Squiggle',
    className: styles.squiggle,
    font: 'signature',
    ink: 'ink',
    inks: POSTCARD_INK_KEYS,
    fieldClassName: ON_A_LIGHT_CARD,
  },
  'sunny-check': {
    label: 'Sunny Check',
    className: styles.check,
    font: 'modern',
    ink: 'ink',
    inks: POSTCARD_INK_KEYS,
    fieldClassName: ON_A_LIGHT_CARD,
  },
  'peach-pop': {
    label: 'Peach Pop',
    className: styles.peach,
    font: 'classic',
    ink: 'ink',
    inks: POSTCARD_INK_KEYS,
    fieldClassName: ON_A_LIGHT_CARD,
  },
  'mint-breeze': {
    label: 'Mint Breeze',
    className: styles.mint,
    font: 'modern',
    ink: 'forest',
    inks: POSTCARD_INK_KEYS,
    fieldClassName: ON_A_LIGHT_CARD,
  },
  'sky-note': {
    label: 'Sky Note',
    className: styles.sky,
    font: 'signature',
    ink: 'navy',
    inks: POSTCARD_INK_KEYS,
    fieldClassName: ON_A_LIGHT_CARD,
  },
};

/** A template chosen at random, so a new card is not the same card every time. */
export function randomKudosTemplateKey(): KudosTemplateKey {
  const index = Math.floor(Math.random() * KUDOS_TEMPLATE_KEYS.length);
  return KUDOS_TEMPLATE_KEYS[index] ?? KUDOS_TEMPLATE_KEYS[0];
}
