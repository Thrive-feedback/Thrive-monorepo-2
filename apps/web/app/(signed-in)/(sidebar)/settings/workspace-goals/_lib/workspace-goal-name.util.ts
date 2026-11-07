/** As the API counts: what a reader sees as one character, so Thai marks do not use it up. */
export const MAX_NAME_LENGTH = 30;
export const MAX_DESCRIPTION_LENGTH = 200;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const NAME_CHARACTERS = /^[\p{L}\p{M}\p{N}_-]+$/u;

function lengthOf(text: string): number {
  return [...graphemes.segment(text)].length;
}

/** The name as the API will store it: trimmed, and without a `#` someone typed before it. */
export function tidyName(raw: string): string {
  return raw.trim().replace(/^#/u, '').normalize('NFC');
}

/**
 * What is wrong with a name before it is sent, in the words the form shows, or `undefined` when
 * nothing is. The same rules the API applies, so the Admin hears at once rather than after a
 * round trip; whether the name is already taken only the API can say.
 */
export function checkName(raw: string): string | undefined {
  const name = tidyName(raw);
  if (name === '') {
    return 'Give it a name.';
  }
  if (/\s/u.test(name)) {
    return 'Use - instead of spaces.';
  }
  if (!NAME_CHARACTERS.test(name)) {
    return 'Use only letters, numbers, - and _.';
  }
  if (lengthOf(name) > MAX_NAME_LENGTH) {
    return `Keep it to ${MAX_NAME_LENGTH} characters.`;
  }
  return undefined;
}

/** What is wrong with a description before it is sent, or `undefined` when nothing is. */
export function checkDescription(raw: string): string | undefined {
  return lengthOf(raw.trim().replace(/\s+/gu, ' ')) > MAX_DESCRIPTION_LENGTH
    ? `Keep it to one sentence of ${MAX_DESCRIPTION_LENGTH} characters.`
    : undefined;
}

/**
 * The `#`-prefixed name Members write. The API returns names without one, and an Admin may
 * write one.
 */
export function hashtagOf(name: string): string {
  return `#${name}`;
}
