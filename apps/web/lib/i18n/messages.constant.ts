import type { Locale } from './locale.constant';
import en from './messages/en.json';
import th from './messages/th.json';

export type Messages = typeof en;

/**
 * `th` is typed as `Messages`, so a key English has and Thai lacks fails the type check, and
 * `messages.test.ts` catches what the type cannot: an empty value or a placeholder that differs.
 */
export const MESSAGES: Record<Locale, Messages> = { en, th };
