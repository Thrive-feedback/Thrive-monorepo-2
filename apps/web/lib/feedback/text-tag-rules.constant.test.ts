import { describe, expect, it } from 'vitest';
import { segmentsOf } from '@/lib/tag-text.util';
import { TEXT_TAG_RULES } from './text-tag-rules.constant';

/**
 * The same table the API's `WrittenTags` is tested against, so what is highlighted while typing
 * is what is bound on sending. Change one, change both.
 */
const WRITTEN: { text: string; hashtags: string[]; slugs: string[] }[] = [
  { text: 'Great work #ownership', hashtags: ['ownership'], slugs: [] },
  { text: 'ดีมาก#ลูกค้ามาก่อน!', hashtags: ['ลูกค้ามาก่อน'], slugs: [] },
  {
    text: '(#ship_2026) and #own-ership.',
    hashtags: ['ship_2026', 'own-ership'],
    slugs: [],
  },
  { text: '#a#b', hashtags: ['a', 'b'], slugs: [] },
  { text: 'a lone # sign', hashtags: [], slugs: [] },
  { text: 'thanks @ann.lee.', hashtags: [], slugs: ['ann.lee'] },
  { text: 'with @Ann.Lee today', hashtags: [], slugs: ['ann.lee'] },
  { text: 'mail ann@thrive.co', hashtags: [], slugs: ['thrive.co'] },
  { text: 'nobody @-ann or @ alone', hashtags: [], slugs: [] },
  {
    text: '@cara-2 and #ownership',
    hashtags: ['ownership'],
    slugs: ['cara-2'],
  },
];

function keysOf(text: string, char: string): string[] {
  return segmentsOf(text, TEXT_TAG_RULES).flatMap((segment) =>
    segment.kind === 'tag' && segment.char === char ? [segment.key] : [],
  );
}

describe('the hashtags and slugs written in Feedback', () => {
  it.each(WRITTEN)('finds them in "$text"', ({ text, hashtags, slugs }) => {
    expect([keysOf(text, '#'), keysOf(text, '@')]).toEqual([
      hashtags.map((name) => name.toLowerCase()),
      slugs,
    ]);
  });
});
