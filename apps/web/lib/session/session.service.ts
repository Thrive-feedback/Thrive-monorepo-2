import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import type {
  CurrentAccount,
  CurrentMembership,
  CurrentProfile,
} from './current-account.type';
import {
  toCurrentAccount,
  toCurrentMembership,
  toNeedsRefresh,
} from './session.transform';

async function forwardedCookie(): Promise<string | undefined> {
  return (await headers()).get('cookie') ?? undefined;
}

/**
 * The API's read of this request's session. `cache` makes the navbar and the page share
 * one API call per request, and never longer. The read changes nothing on the API.
 */
const readCurrentSession = cache(async () => {
  const result = await apiClient().GET('/v1/sessions/current', {
    params: { header: { cookie: await forwardedCookie() } },
    cache: 'no-store',
  });
  return unwrap(result);
});

/**
 * The Workspace this request's person belongs to, if any. Asked alongside the session
 * rather than after it, so a page waits for one round trip, not two.
 */
const readCurrentMembership = cache(
  async (): Promise<CurrentMembership | null> => {
    try {
      const result = await apiClient().GET('/v1/members/mine', {
        params: {
          header: { cookie: await forwardedCookie() },
          query: { page: 1, pageSize: 1 },
        },
        cache: 'no-store',
      });
      return toCurrentMembership(unwrap(result));
    } catch (error) {
      // Signed out: the session read says so, and decides where to go.
      if (error instanceof ApiError && error.code === 'NOT_SIGNED_IN') {
        return null;
      }
      throw error;
    }
  },
);

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

/** An Account that belongs to a Workspace. */
export type MemberAccount = IntroducedAccount & {
  readonly membership: CurrentMembership;
};

/** Where a signed-in person belongs, with what that page needs to know about them. */
export type Landing =
  | { readonly page: 'introduceYourself'; readonly account: CurrentAccount }
  | { readonly page: 'createWorkspace'; readonly account: IntroducedAccount }
  | { readonly page: 'home'; readonly account: MemberAccount };

const LANDING_ROUTES: Readonly<Record<Landing['page'], string>> = {
  introduceYourself: ROUTES.register.introduceYourself,
  createWorkspace: ROUTES.register.createWorkspace,
  home: ROUTES.home,
};

/**
 * The one rule for where a signed-in person belongs: introduce yourself, then create a
 * Workspace, then Home. Every signed-in page asks this rather than deciding for itself.
 */
export function landingFor(
  account: CurrentAccount,
  membership: CurrentMembership | null,
): Landing {
  const { profile } = account;
  if (!profile) {
    return { page: 'introduceYourself', account };
  }
  if (!membership) {
    return { page: 'createWorkspace', account: { ...account, profile } };
  }
  return { page: 'home', account: { ...account, profile, membership } };
}

/**
 * Keeps `signedIn=1` across a redirect, so a person Google sent to the wrong page for them
 * is still told once that they are signed in.
 */
function withSignedIn(path: string, signedIn: '1' | undefined): string {
  return signedIn === undefined ? path : `${path}?signedIn=${signedIn}`;
}

/** Where this request's person belongs, or off to sign in if nobody is signed in. */
async function readLanding(): Promise<Landing> {
  const [account, membership] = await Promise.all([
    readSession(),
    readCurrentMembership(),
  ]);
  if (!account) {
    redirect(ROUTES.signIn);
  }
  return landingFor(account, membership);
}

function sendTo(landing: Landing, signedIn: '1' | undefined): never {
  redirect(withSignedIn(LANDING_ROUTES[landing.page], signedIn));
}

/**
 * The signed-in Member, for a page only someone in a Workspace may see. Anyone else is sent
 * where they belong.
 */
export async function requireMember(signedIn?: '1'): Promise<MemberAccount> {
  const landing = await readLanding();
  if (landing.page !== 'home') {
    sendTo(landing, signedIn);
  }
  return landing.account;
}

/** The signed-in Account, for Introduce yourself: the step only appears until it is done. */
export async function requireAccountToIntroduce(
  signedIn?: '1',
): Promise<CurrentAccount> {
  const landing = await readLanding();
  if (landing.page !== 'introduceYourself') {
    sendTo(landing, signedIn);
  }
  return landing.account;
}

/** The signed-in Account, for Create a Workspace: only for someone in none yet. */
export async function requireAccountToCreateWorkspace(): Promise<IntroducedAccount> {
  const landing = await readLanding();
  if (landing.page !== 'createWorkspace') {
    sendTo(landing, undefined);
  }
  return landing.account;
}
