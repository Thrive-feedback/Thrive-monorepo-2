'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { LOCALE_COOKIE_NAME, LOCALES } from './locale.constant';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const localeSchema = z.enum(LOCALES);

/**
 * Remembers the language in a cookie that outlives the visit, so a refresh or a return keeps it.
 * A server action is a public endpoint, so the value is checked even though the switch only
 * ever sends a known one.
 */
export async function setLocale(locale: unknown): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, localeSchema.parse(locale), {
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
