import { describe, expect, it } from 'bun:test';
import { PostcardInvalidError } from '../feedback-request.errors';
import {
  Postcard,
  type PostcardSnapshot,
  type PostcardStickerSnapshot,
} from './postcard.vo';

const STICKER: PostcardStickerSnapshot = {
  stickerKey: 'system/sticker-01-thumbs-up',
  side: 'front',
  x: 62,
  y: 40,
  scale: 1.2,
  rotation: -8,
};

const CARD: PostcardSnapshot = {
  templateKey: 'system/postcard_template_2',
  tone: 'sage',
  textStyle: { font: 'classic', sizeStep: 2, align: 'left', ink: 'navy' },
  stickers: [STICKER],
  stampKey: 'system/stamp-02-ocean',
};

describe('a postcard', () => {
  it('keeps everything a writer put on the card', () => {
    expect(Postcard.of(CARD).snapshot()).toEqual(CARD);
  });

  it('takes a card with no stickers and no stamp', () => {
    const card = { ...CARD, stickers: [], stampKey: null };

    expect(Postcard.of(card).snapshot()).toEqual(card);
  });

  it('takes a sticker on any edge of the card, at its smallest and most turned', () => {
    const sticker = { ...STICKER, x: 0, y: 100, scale: 0.5, rotation: 180 };

    expect(() => Postcard.of({ ...CARD, stickers: [sticker] })).not.toThrow();
  });

  it('is refused with a fourth sticker, because a card carries three', () => {
    expect(() =>
      Postcard.of({
        ...CARD,
        stickers: [STICKER, STICKER, STICKER, STICKER],
      }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when its stamp key is not a picture key', () => {
    expect(() => Postcard.of({ ...CARD, stampKey: 'ocean.png' })).toThrow(
      PostcardInvalidError,
    );
  });

  it('is refused when its template key is not a picture key', () => {
    expect(() =>
      Postcard.of({ ...CARD, templateKey: '../postcard_template_2' }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a sticker key is not a picture key', () => {
    expect(() =>
      Postcard.of({
        ...CARD,
        stickers: [{ ...STICKER, stickerKey: 'heart.png' }],
      }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a sticker sits off the card', () => {
    expect(() =>
      Postcard.of({ ...CARD, stickers: [{ ...STICKER, x: 100.5 }] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a sticker is smaller than the card can show', () => {
    expect(() =>
      Postcard.of({ ...CARD, stickers: [{ ...STICKER, scale: 0.4 }] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a sticker is turned past a half turn', () => {
    expect(() =>
      Postcard.of({ ...CARD, stickers: [{ ...STICKER, rotation: 181 }] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused at a text size off the scale', () => {
    const textStyle = { ...CARD.textStyle, sizeStep: 5 };

    expect(() => Postcard.of({ ...CARD, textStyle })).toThrow(
      PostcardInvalidError,
    );
  });

  it('is refused at a text size between two steps', () => {
    const textStyle = { ...CARD.textStyle, sizeStep: 1.5 };

    expect(() => Postcard.of({ ...CARD, textStyle })).toThrow(
      PostcardInvalidError,
    );
  });

  it('is read back even if it would no longer be accepted', () => {
    const stored = {
      ...CARD,
      stickers: [STICKER, STICKER, STICKER, STICKER],
    };

    expect(Postcard.restore(stored).snapshot()).toEqual(stored);
  });
});
