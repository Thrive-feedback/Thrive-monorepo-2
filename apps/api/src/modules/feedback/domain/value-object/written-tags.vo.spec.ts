import { describe, expect, it } from 'bun:test';
import { WrittenTags } from './written-tags.vo';

/**
 * The same table the web app's tokenizer is tested against, so what is highlighted while typing
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

describe('the hashtags and slugs written in some text', () => {
  it.each(WRITTEN)('finds them in "$text"', ({ text, hashtags, slugs }) => {
    const written = WrittenTags.in(text);

    expect([written.hashtags(), written.slugs()]).toEqual([hashtags, slugs]);
  });

  it('finds them across more than one text, each once whatever its letter case', () => {
    const written = WrittenTags.in(
      'The launch #OWNERSHIP with @cara',
      'Again #ownership and @Cara',
    );

    expect([written.hashtags(), written.slugs()]).toEqual([
      ['OWNERSHIP'],
      ['cara'],
    ]);
  });

  it('reads a name typed with its accent as a separate mark as the same name', () => {
    expect(WrittenTags.in('#cafe\u0301').hashtags()).toEqual(['caf\u00e9']);
  });
});
