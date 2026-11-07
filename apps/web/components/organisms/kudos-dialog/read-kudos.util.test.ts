import { describe, expect, it } from 'vitest';
import { KUDOS_TEMPLATE_KEYS } from './kudos-template.constant';
import { kudosDrawingOf, kudosTiltOf } from './read-kudos.util';

const IDS = Array.from(
  { length: 24 },
  (_, index) => `0199a0f0-0000-7000-8000-${String(index).padStart(12, '0')}`,
);

const CARD: NonNullable<Parameters<typeof kudosDrawingOf>[1]> = {
  templateKey: 'mint-breeze',
  textStyle: {
    font: 'classic',
    sizeStep: 2,
    align: 'left',
    ink: 'forest',
  },
  stickers: [
    {
      stickerKey: 'system/sticker-01-thumbs-up',
      x: 62.5,
      y: 40,
      scale: 1.25,
      rotation: -8,
    },
  ],
};

describe('how far a card leans', () => {
  it('is always the same for one Kudos', () => {
    expect(kudosTiltOf(IDS[3] ?? '')).toBe(kudosTiltOf(IDS[3] ?? ''));
  });

  it('is a small lean, never straight', () => {
    for (const id of IDS) {
      const tilt = Math.abs(kudosTiltOf(id));
      expect(tilt).toBeGreaterThan(0);
      expect(tilt).toBeLessThanOrEqual(3);
    }
  });

  it('differs between Kudos made one after another', () => {
    expect(new Set(IDS.map(kudosTiltOf)).size).toBeGreaterThan(3);
  });
});

describe('the card a Kudos is drawn on', () => {
  it('is the one it was written on', () => {
    const drawing = kudosDrawingOf('kudos-1', CARD);

    expect(drawing.templateKey).toBe('mint-breeze');
    expect(drawing.textStyle).toEqual(CARD.textStyle);
    expect(drawing.stickers[0]).toMatchObject({ x: 62.5, y: 40, rotation: -8 });
  });

  it('keeps one template for a Kudos not written on a card', () => {
    const drawing = kudosDrawingOf('kudos-1', null);

    expect(KUDOS_TEMPLATE_KEYS).toContain(drawing.templateKey);
    expect(kudosDrawingOf('kudos-1', null)).toEqual(drawing);
    expect(drawing.stickers).toEqual([]);
  });

  it('draws a template this app no longer has on one it does', () => {
    const drawing = kudosDrawingOf('kudos-1', {
      ...CARD,
      templateKey: 'a-retired-template',
    });

    expect(KUDOS_TEMPLATE_KEYS).toContain(drawing.templateKey);
    expect(drawing.textStyle).toEqual(CARD.textStyle);
  });
});
