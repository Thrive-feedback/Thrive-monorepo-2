import { describe, expect, it } from 'bun:test';
import { KudosCardInvalidError } from '../feedback-request.errors';
import { KudosCard, type KudosCardSnapshot } from './kudos-card.vo';

const STICKER = {
  stickerKey: 'system/sticker-01-thumbs-up',
  x: 62,
  y: 40,
  scale: 1.2,
  rotation: -8,
};

const CARD: KudosCardSnapshot = {
  templateKey: 'cobalt-dash',
  textStyle: { font: 'signature', sizeStep: 4, align: 'center', ink: 'paper' },
  stickers: [STICKER],
};

describe('a Kudos card', () => {
  it('keeps everything a Giver put on the card', () => {
    expect(KudosCard.of(CARD).snapshot()).toEqual(CARD);
  });

  it('takes a card with no stickers', () => {
    const card = { ...CARD, stickers: [] };

    expect(KudosCard.of(card).snapshot()).toEqual(card);
  });

  it('takes a template the web app has since retired, because only its shape is checked', () => {
    expect(() =>
      KudosCard.of({ ...CARD, templateKey: 'long-gone-1' }),
    ).not.toThrow();
  });

  it('is refused with a template key that is not a slug', () => {
    expect(() =>
      KudosCard.of({ ...CARD, templateKey: 'system/cobalt' }),
    ).toThrow(KudosCardInvalidError);
  });

  it('is refused with a fourth sticker, because a card carries three', () => {
    expect(() =>
      KudosCard.of({
        ...CARD,
        stickers: [STICKER, STICKER, STICKER, STICKER],
      }),
    ).toThrow(KudosCardInvalidError);
  });

  it('is refused with a sticker off the card', () => {
    expect(() =>
      KudosCard.of({ ...CARD, stickers: [{ ...STICKER, x: 101 }] }),
    ).toThrow(KudosCardInvalidError);
  });

  it('is refused with a text size past the largest', () => {
    expect(() =>
      KudosCard.of({
        ...CARD,
        textStyle: { ...CARD.textStyle, sizeStep: 5 },
      }),
    ).toThrow(KudosCardInvalidError);
  });
});
