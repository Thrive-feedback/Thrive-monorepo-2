import { describe, expect, it } from 'bun:test';
import type { KudosCardSnapshot } from '../../domain/value-object/kudos-card.vo';
import { toKudosCardSnapshot } from './kudos.mapper';

const A_CARD: KudosCardSnapshot = {
  templateKey: 'red-squiggle',
  textStyle: { font: 'classic', sizeStep: 2, align: 'right', ink: 'brick' },
  stickers: [],
};

describe('toKudosCardSnapshot', () => {
  it('reads a stored card', () => {
    expect(toKudosCardSnapshot(A_CARD)).toEqual(A_CARD);
  });

  it('reads no card as none', () => {
    expect(toKudosCardSnapshot(null)).toBeNull();
  });

  it('reads a card that no longer reads as none, rather than failing the list', () => {
    const retired = {
      ...A_CARD,
      textStyle: { ...A_CARD.textStyle, ink: 'a-retired-ink' },
    };

    expect(toKudosCardSnapshot(retired)).toBeNull();
  });

  it('keeps a card past a limit tightened since it was sent', () => {
    const large = {
      ...A_CARD,
      textStyle: { ...A_CARD.textStyle, sizeStep: 99 },
    };

    expect(toKudosCardSnapshot(large)?.textStyle.sizeStep).toBe(99);
  });
});
