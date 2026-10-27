import type { Teammate } from './teammate.type';

/**
 * The handle `@` finds a teammate by: their slug, or the part of their email before the `@`
 * while they have not introduced themselves and so have no slug.
 */
export function mentionHandle(teammate: Teammate): string {
  return (teammate.slug ?? teammate.email.split('@')[0] ?? '').toLowerCase();
}

export type TakenMentions = {
  /** Every teammate a finished `@handle` named, once each, in the order they were typed. */
  readonly accountIds: readonly string[];
  /** What stays in the search field: words that are not handles, and handles that named nobody. */
  readonly rest: string;
  /** The finished handles that named nobody, as typed. */
  readonly unknown: readonly string[];
};

/** Punctuation a pasted list puts after a handle, as in "@mali, @krit". */
const TRAILING_PUNCTUATION = /[,;.]+$/;

/**
 * Takes every finished `@handle` out of what was typed into a people search. A word is finished
 * once a space follows it, or when `finishAll` is set (Enter, or a paste). The word still being
 * typed is left alone, so "@ma" is not mistaken for nobody before "@mali" is done.
 */
export function takeMentions(
  text: string,
  teammates: readonly Teammate[],
  { finishAll = false }: { finishAll?: boolean } = {},
): TakenMentions {
  const words = text.split(/\s+/).filter(Boolean);
  const endsFinished = finishAll || /\s$/.test(text);
  const typing = endsFinished ? undefined : words.pop();
  const byHandle = new Map(
    teammates.map((teammate) => [mentionHandle(teammate), teammate.accountId]),
  );
  const accountIds: string[] = [];
  const kept: string[] = [];
  const unknown: string[] = [];

  for (const word of words) {
    if (!word.startsWith('@')) {
      kept.push(word);
      continue;
    }
    const handle = word
      .slice(1)
      .replace(TRAILING_PUNCTUATION, '')
      .toLowerCase();
    const accountId = byHandle.get(handle);
    if (accountId === undefined) {
      kept.push(word);
      unknown.push(word);
    } else if (!accountIds.includes(accountId)) {
      accountIds.push(accountId);
    }
  }

  if (typing !== undefined) {
    kept.push(typing);
  }
  const trailingSpace = typing === undefined && kept.length > 0 ? ' ' : '';
  return { accountIds, rest: kept.join(' ') + trailingSpace, unknown };
}

/** The word a people search is filtering by: the last one still being typed, without its `@`. */
export function searchWord(text: string): string {
  if (/\s$/.test(text)) {
    return '';
  }
  const last = text.split(/\s+/).pop() ?? '';
  return last.replace(/^@/, '').toLowerCase();
}

/** Whether a teammate's name, email or handle holds the word. An empty word matches everyone. */
export function matchesSearch(teammate: Teammate, word: string): boolean {
  if (word === '') {
    return true;
  }
  return [teammate.name, teammate.email, mentionHandle(teammate)].some(
    (field) => field.toLowerCase().includes(word),
  );
}
