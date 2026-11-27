import { describe, expect, it } from 'vitest';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  copyOf,
  isKeepable,
  MAX_TEMPLATE_NAME_LENGTH,
} from './one-on-one-template.util';

const RETRO: OneOnOneTemplate = {
  key: '0199a0f0-0000-7000-8000-0000000000c1',
  scope: 'PERSONAL',
  name: 'Sprint retro',
  suggestedWhen: 'After each sprint',
  questions: ['What slowed us?'],
  changeable: true,
};

describe('copyOf', () => {
  it('keeps the name of one copied into another layer, and tells a copy in its own layer apart', () => {
    expect(copyOf(RETRO, { sameLayer: false }).name).toBe('Sprint retro');
    expect(copyOf(RETRO, { sameLayer: true })).toEqual({
      name: 'Sprint retro (copy)',
      suggestedWhen: 'After each sprint',
      questions: ['What slowed us?'],
    });
  });

  it('never names a copy longer than a name may be', () => {
    const long = { ...RETRO, name: 'n'.repeat(MAX_TEMPLATE_NAME_LENGTH) };

    expect(copyOf(long, { sameLayer: true }).name).toHaveLength(
      MAX_TEMPLATE_NAME_LENGTH,
    );
  });
});

describe('isKeepable', () => {
  it('needs a name and one question that is not blank', () => {
    expect(
      isKeepable({ name: 'Retro', suggestedWhen: '', questions: ['', 'Q?'] }),
    ).toBe(true);
    expect(
      isKeepable({ name: ' ', suggestedWhen: '', questions: ['Q?'] }),
    ).toBe(false);
    expect(
      isKeepable({ name: 'Retro', suggestedWhen: '', questions: ['  '] }),
    ).toBe(false);
  });
});
