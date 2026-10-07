import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentAccount, CurrentProfile } from './current-account.type';
import { toCurrentAccount, toNeedsRefresh } from './session.transform';

/**
 * The API's read of this request's session. `cache` makes the navbar and the page share
 * one API call per request, and never longer. The read changes nothing on the API.
 */
const readCurrentSession = cache(async () => {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const result = await apiClient().GET('/v1/sessions/current', {
    params: { header: { cookie } },
    cache: 'no-store',
  });
  return unwrap(result);
});

/**
 * Who this request is signed in as, asked of the API every time. The proxy only saw that a
 * cookie exists; this is the check that counts, because a cookie can be forged or expired.
 */
export async function readSession(): Promise<CurrentAccount | null> {
  return toCurrentAccount(await readCurrentSession());
}

/**
 * Whether the session should be pushed forward now. A server component cannot set the new
 * cookie, so it renders the refresher, which runs the `refreshSession` action instead.
 */
export async function readSessionNeedsRefresh(): Promise<boolean> {
  return toNeedsRefresh(await readCurrentSession());
}

/** An Account that has introduced itself, so it has a Profile. */
export type IntroducedAccount = CurrentAccount & {
  readonly profile: CurrentProfile;
};

/**
 * Keeps `signedIn=1` across a redirect, so a person Google sent to the wrong page for them
 * is still told once that they are signed in.
 */
function withSignedIn(path: string, signedIn: '1' | undefined): string {
  return signedIn === undefined ? path : `${path}?signedIn=${signedIn}`;
}

/**
 * The signed-in Account, for a page only someone who has introduced themselves may see.
 * Anyone else is sent where they belong: to sign in, or to introduce themselves first.
 */
export async function requireIntroducedAccount(
  signedIn?: '1',
): Promise<IntroducedAccount> {
  const account = await readSession();
  if (!account) {
    redirect(ROUTES.login);
  }
  if (!account.profile) {
    redirect(withSignedIn(ROUTES.register.introduceYourself, signedIn));
  }
  return { ...account, profile: account.profile };
}

/**
 * The signed-in Account, for Introduce yourself. Someone who has already introduced
 * themselves is sent home: the step only appears until it is done.
 */
export async function requireAccountToIntroduce(
  signedIn?: '1',
): Promise<CurrentAccount> {
  const account = await readSession();
  if (!account) {
    redirect(ROUTES.login);
  }
  if (account.profile) {
    redirect(withSignedIn(ROUTES.home, signedIn));
  }
  return account;
}
