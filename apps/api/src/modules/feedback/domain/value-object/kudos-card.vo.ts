import { KudosCardInvalidError } from '../feedback-request.errors';
import {
  hasValidWriting,
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
  POSTCARD_INKS,
  type PostcardStickerSnapshot,
} from './postcard.vo';

/** The postcard's inks and `paper`, the card's own colour, for a template too dark for them. */
export const KUDOS_INKS = [...POSTCARD_INKS, 'paper'] as const;

/** As `PostcardSnapshot`, an alias so Prisma's JSON input takes it. A card has one side. */
export type KudosCardSnapshot = {
  /** A key from the web app's Kudos templates. */
  readonly templateKey: string;
  readonly textStyle: {
    readonly font: (typeof POSTCARD_FONTS)[number];
    /** The largest of the web app's five sizes the message may be set in, smallest first. */
    readonly sizeStep: number;
    readonly align: (typeof POSTCARD_ALIGNS)[number];
    readonly ink: (typeof KUDOS_INKS)[number];
  };
  /** Oldest first, which is also the order they stack in: a later one sits on an earlier one. */
  readonly stickers: readonly Omit<PostcardStickerSnapshot, 'side'>[];
};

/** A slug: a template is drawn by the web app, so its key names no file. Bounded like a picture's. */
const TEMPLATE_KEY = /^[a-z0-9-]{1,40}$/;

/**
 * How a Kudos looks: its template, how its words are set and the stickers on it. Every Member reads
 * a Kudos, so everyone reads its card (ADR 0073).
 *
 * The templates belong to the web app, and a retired one stays valid on the cards that used it, so
 * a key is checked for its shape and never against a list.
 */
export class KudosCard {
  private constructor(private readonly value: KudosCardSnapshot) {}

  static of(details: KudosCardSnapshot): KudosCard {
    if (!TEMPLATE_KEY.test(details.templateKey) || !hasValidWriting(details)) {
      throw new KudosCardInvalidError();
    }
    return new KudosCard(details);
  }

  snapshot(): KudosCardSnapshot {
    return this.value;
  }
}
