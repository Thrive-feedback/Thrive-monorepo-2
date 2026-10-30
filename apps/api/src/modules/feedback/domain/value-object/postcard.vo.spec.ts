import { describe, expect, it } from 'bun:test';
import { PostcardInvalidError } from '../feedback-request.errors';
import {
  Postcard,
  type PostcardSnapshot,
  type PostcardStampSnapshot,
} from './postcard.vo';

const STAMP: PostcardStampSnapshot = {
  stampKey: 'system/stamp-02-ocean',
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
  stamps: [STAMP],
};

describe('a postcard', () => {
  it('keeps everything a writer put on the card', () => {
    expect(Postcard.of(CARD).snapshot()).toEqual(CARD);
  });

  it('takes a card with no stamps', () => {
    const card = { ...CARD, stamps: [] };

    expect(Postcard.of(card).snapshot()).toEqual(card);
  });

  it('takes a stamp on any edge of the card, at its smallest and most turned', () => {
    const stamp = { ...STAMP, x: 0, y: 100, scale: 0.5, rotation: 180 };

    expect(() => Postcard.of({ ...CARD, stamps: [stamp] })).not.toThrow();
  });

  it('is refused with a fourth stamp, because a card carries three', () => {
    expect(() =>
      Postcard.of({ ...CARD, stamps: [STAMP, STAMP, STAMP, STAMP] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when its template key is not a picture key', () => {
    expect(() =>
      Postcard.of({ ...CARD, templateKey: '../postcard_template_2' }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a stamp key is not a picture key', () => {
    expect(() =>
      Postcard.of({ ...CARD, stamps: [{ ...STAMP, stampKey: 'ocean.png' }] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a stamp sits off the card', () => {
    expect(() =>
      Postcard.of({ ...CARD, stamps: [{ ...STAMP, x: 100.5 }] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a stamp is smaller than the card can show', () => {
    expect(() =>
      Postcard.of({ ...CARD, stamps: [{ ...STAMP, scale: 0.4 }] }),
    ).toThrow(PostcardInvalidError);
  });

  it('is refused when a stamp is turned past a half turn', () => {
    expect(() =>
      Postcard.of({ ...CARD, stamps: [{ ...STAMP, rotation: 181 }] }),
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
    const stored = { ...CARD, stamps: [STAMP, STAMP, STAMP, STAMP] };

    expect(Postcard.restore(stored).snapshot()).toEqual(stored);
  });
});
