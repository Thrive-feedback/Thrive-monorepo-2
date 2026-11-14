import { matchesSearch } from '@/lib/feedback/member-search.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { TEAMMATES_PER_PAGE } from './teammates.constant';

/**
 * One fixed collation, English: Latin names, then Thai. The list is drawn on the server and again
 * in the browser, so an order taken from whichever language each runs in would differ between the
 * two for a reader whose browser is in Thai.
 */
const BY_NAME = new Intl.Collator('en', { sensitivity: 'base' });

/** Teammates by name, as a list of people is read, whatever order the Workspace was joined in. */
export function byName(teammates: readonly Teammate[]): Teammate[] {
  return [...teammates].sort((a, b) => BY_NAME.compare(a.name, b.name));
}

/**
 * The teammates a search finds: those the `@` picker would find, by name, email or @handle, and also
 * by the name they go by, in any letter case. A leading `@` is how a handle is written, so it is read
 * past; nothing typed finds everyone.
 */
export function searchTeammates(
  teammates: readonly Teammate[],
  query: string,
): readonly Teammate[] {
  const wanted = query.trim().replace(/^@/, '').toLowerCase();
  if (wanted === '') {
    return teammates;
  }
  return teammates.filter(
    (teammate) =>
      matchesSearch(teammate, wanted) ||
      (teammate.displayName?.toLowerCase().includes(wanted) ?? false),
  );
}

/** One page of a list, counted from one, and how many pages there are; an empty list is one page. */
export function pageOf<T>(
  items: readonly T[],
  page: number,
  perPage: number = TEAMMATES_PER_PAGE,
): { items: readonly T[]; page: number; pageTotal: number } {
  const pageTotal = Math.max(1, Math.ceil(items.length / perPage));
  const shown = Math.min(Math.max(1, page), pageTotal);
  return {
    items: items.slice((shown - 1) * perPage, shown * perPage),
    page: shown,
    pageTotal,
  };
}
