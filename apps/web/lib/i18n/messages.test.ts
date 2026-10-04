import { describe, expect, it } from 'vitest';
import { LOCALES } from './locale.constant';
import { MESSAGES } from './messages.constant';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      entries.set(path, value);
    } else {
      for (const entry of flatten(value, path)) {
        entries.set(...entry);
      }
    }
  }
  return entries;
}

/**
 * The names a message expects to be given: `{name}`, `{count, plural, …}` and `<tag>`. A plural
 * branch such as `{We invited # teammates.}` is text, not a name, which the trailing `,` or `}`
 * tells apart.
 */
function placeholders(message: string): string[] {
  const names = [
    ...message.matchAll(/\{\s*(\w+)\s*[,}]/g),
    ...message.matchAll(/<(\w+)>/g),
  ].flatMap(([, name]) => (name ? [name] : []));
  return [...new Set(names)].sort();
}

const english = flatten(MESSAGES.en);
const others = LOCALES.filter((locale) => locale !== 'en');

describe.each(others)('the %s messages', (locale) => {
  const translated = flatten(MESSAGES[locale]);

  it('have exactly the keys English has', () => {
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it.each([...english.keys()])('give %s the same placeholders', (key) => {
    expect(placeholders(translated.get(key) ?? '')).toEqual(
      placeholders(english.get(key) ?? ''),
    );
  });
});

describe.each(LOCALES)('every %s message', (locale) => {
  it.each([...flatten(MESSAGES[locale])])('%s is written', (_, message) => {
    expect(message.trim()).not.toBe('');
  });
});
