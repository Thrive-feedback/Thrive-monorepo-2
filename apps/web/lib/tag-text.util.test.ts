import { describe, expect, it } from 'vitest';
import {
  HASHTAG_RULE,
  MENTION_RULE,
} from '@/lib/feedback/text-tag-rules.constant';
import { segmentsOf, tagKeyOf, typedTriggerAt } from './tag-text.util';

const RULES = [HASHTAG_RULE, MENTION_RULE];

describe('splitting text into runs and tags', () => {
  it('keeps every character, so the runs joined are the text', () => {
    const text = 'Thanks @cara.\n\nดีมาก#Ownership, again #ownership!';

    const segments = segmentsOf(text, RULES);

    expect(segments.map((segment) => segment.text).join('')).toBe(text);
    expect(segments.filter((segment) => segment.kind === 'tag')).toEqual([
      { kind: 'tag', char: '@', text: '@cara', key: 'cara' },
      { kind: 'tag', char: '#', text: '#Ownership', key: 'ownership' },
      { kind: 'tag', char: '#', text: '#ownership', key: 'ownership' },
    ]);
  });

  it('answers text with no tag as one run', () => {
    expect(segmentsOf('plain words', RULES)).toEqual([
      { kind: 'text', text: 'plain words' },
    ]);
  });

  it('answers empty text with nothing', () => {
    expect(segmentsOf('', RULES)).toEqual([]);
  });
});

describe('the key a tag is matched by', () => {
  it('is the same however its letters were cased or its accents typed', () => {
    expect(tagKeyOf('Café')).toBe(tagKeyOf('CAFÉ'));
  });
});

describe('the tag being typed before the caret', () => {
  it('is the hashtag the caret has just started', () => {
    expect(typedTriggerAt('Great work #', 12, RULES)).toEqual({
      char: '#',
      query: '',
      start: 11,
    });
  });

  it('follows the letters typed after it, Thai included, wherever it was written', () => {
    const text = 'ดีมาก#ลูกค้า';

    expect(typedTriggerAt(text, text.length, RULES)).toEqual({
      char: '#',
      query: 'ลูกค้า',
      start: 5,
    });
  });

  it('searches a Member by name while picking, before a slug is written', () => {
    const text = 'with @สมชาย';

    expect(typedTriggerAt(text, text.length, RULES)).toEqual({
      char: '@',
      query: 'สมชาย',
      start: 5,
    });
  });

  it('is nothing once a space ends the tag', () => {
    expect(typedTriggerAt('Great #ownership ', 17, RULES)).toBeNull();
  });

  it('is nothing with no tag before the caret', () => {
    expect(typedTriggerAt('Great work', 10, RULES)).toBeNull();
  });

  it('is the closer of two kinds of tag', () => {
    expect(typedTriggerAt('#own@ca', 7, RULES)).toEqual({
      char: '@',
      query: 'ca',
      start: 4,
    });
  });

  it('looks only before the caret, not at what follows it', () => {
    expect(typedTriggerAt('#own and more', 4, RULES)).toEqual({
      char: '#',
      query: 'own',
      start: 0,
    });
  });
});
