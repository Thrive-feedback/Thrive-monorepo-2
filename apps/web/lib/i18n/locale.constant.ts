/** The languages every screen is written in. English is first because it is the default. */
export const LOCALES = ['en', 'th'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE_NAME = 'thrive_locale';

/** Every date is shown on Bangkok's clock, so the server and the browser agree on the day. */
export const TIME_ZONE = 'Asia/Bangkok';

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}
