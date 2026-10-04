import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE_NAME,
  TIME_ZONE,
} from './locale.constant';
import { MESSAGES } from './messages.constant';

/**
 * The language is read from a cookie, not the address, so every URL stays the same in both
 * languages. Anything that is not a known language — no cookie, or a hand-edited one — is
 * English.
 *
 * A missing message is stopped before it can render as its key: `t('…')` is typed against the
 * English messages, Thai is typed as having every one of them, and `messages.test.ts` checks
 * what the types cannot.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requested = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return {
    locale,
    messages: MESSAGES[locale],
    timeZone: TIME_ZONE,
  };
});
