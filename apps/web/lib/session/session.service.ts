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
import type {
  PendingInvitation,
  PendingInvitations,
} from './pending-invitation.type';
import {
  toCurrentAccount,
  toCurrentMembership,
  toNeedsRefresh,
  toPendingInvitations,
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
 * The Workspace this request's session is in, if any: the one chosen in this browser, or the only
 * one for someone in just one. Asked alongside the session rather than after it, so a page waits
 * for one round trip, not two.
 */
const readCurrentMembership = cache(
  async (): Promise<CurrentMembership | null> => {
    try {
      const result = await apiClient().GET('/v1/members/mine/current', {
        params: { header: { cookie: await forwardedCookie() } },
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
 * How many Workspaces the person can open. Asked only when their session is in none, to tell
 * someone who is to choose from someone who has none to choose.
 */
const readActiveWorkspaceCount = cache(async (): Promise<number> => {
  try {
    const result = await apiClient().GET('/v1/members/mine', {
      params: {
        header: { cookie: await forwardedCookie() },
        query: { page: 1, pageSize: 1, status: 'ACTIVE' },
      },
      cache: 'no-store',
    });
    return unwrap(result).total;
  } catch (error) {
    // Signed out since the session was read: the next step's own call finds that out.
    if (error instanceof ApiError && error.code === 'NOT_SIGNED_IN') {
      return 0;
    }
    throw error;
  }
});

/**
 * Who this request is signed in as, asked of the API every time. The proxy only saw that a
 * cookie exists; this is the check that counts, because a cookie can be forged or expired.
 */
export async function readSession(): Promise<CurrentAccount | null> {
  return toCurrentAccount(await readCurrentSession());
}

/**
 * The Invitations sent to this request's person that they could accept now. Asked of someone in
 * no Workspace while deciding where they land, and of a Member only by Home's notice, which
 * streams in, so no page waits on it. One page holds them all: the API's largest, far more than
 * anyone is invited to at once.
 */
const readMyInvitations = cache(async (): Promise<PendingInvitation[]> => {
  try {
    const result = await apiClient().GET('/v1/invitations/mine', {
      params: {
        header: { cookie: await forwardedCookie() },
        query: { page: 1, pageSize: 100 },
      },
      cache: 'no-store',
    });
    return toPendingInvitations(unwrap(result));
  } catch (error) {
    // Signed out since the session was read: the next step's own call finds that out and
    // sends them to sign in. Any other failure stays loud, because answering "none" would
    // quietly hide Invitations from someone about to create a Workspace instead.
    if (error instanceof ApiError && error.code === 'NOT_SIGNED_IN') {
      return [];
    }
    throw error;
  }
});

/** The Invitations waiting for this request's person, for the notice on Home. */
export function readInvitationsWaiting(): Promise<PendingInvitation[]> {
  return readMyInvitations();
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
  | {
      readonly page: 'joinWorkspace';
      readonly account: IntroducedAccount;
      readonly invitations: PendingInvitations;
    }
  | { readonly page: 'createWorkspace'; readonly account: IntroducedAccount }
  | { readonly page: 'chooseWorkspace'; readonly account: IntroducedAccount }
  | { readonly page: 'home'; readonly account: MemberAccount };

const LANDING_ROUTES: Readonly<Record<Landing['page'], string>> = {
  introduceYourself: ROUTES.register.introduceYourself,
  joinWorkspace: ROUTES.register.joinWorkspace,
  createWorkspace: ROUTES.register.createWorkspace,
  chooseWorkspace: ROUTES.chooseWorkspace,
  home: ROUTES.home,
};

/**
 * The one rule for where a signed-in person belongs: introduce yourself; then, while this session
 * is in no Workspace, choose one of yours, or join one you were invited to or create one if you
 * have none; then Home. Every signed-in page asks this rather than deciding for itself.
 * `workspaceCount` is how many Workspaces they can open, and `invitations` the ones they could
 * accept now; both are only read while the session is in none.
 */
export function landingFor(
  account: CurrentAccount,
  membership: CurrentMembership | null,
  workspaceCount: number,
  invitations: readonly PendingInvitation[],
): Landing {
  const { profile } = account;
  if (!profile) {
    return { page: 'introduceYourself', account };
  }
  if (!membership) {
    const introduced = { ...account, profile };
    if (workspaceCount > 0) {
      return { page: 'chooseWorkspace', account: introduced };
    }
    const [first, ...rest] = invitations;
    return first
      ? {
          page: 'joinWorkspace',
          account: introduced,
          invitations: [first, ...rest],
        }
      : { page: 'createWorkspace', account: introduced };
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
  const workspaceCount =
    account.profile && !membership ? await readActiveWorkspaceCount() : 0;
  const invitations =
    account.profile && !membership && workspaceCount === 0
      ? await readMyInvitations()
      : [];
  return landingFor(account, membership, workspaceCount, invitations);
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

/**
 * The signed-in Member, for an action sent from a page drawn for `workspaceId`. If that is no
 * longer the Workspace they are in — they switched in another tab, or were Deactivated there —
 * nothing is done: they are taken to Home, which says so, rather than acting on a Workspace the
 * page never showed (ADR 0051).
 */
export async function requireMemberOf(
  workspaceId: string,
): Promise<MemberAccount> {
  const member = await requireMember();
  if (member.membership.workspace.id !== workspaceId) {
    redirect(ROUTES.homeSwitched);
  }
  return member;
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

/**
 * The signed-in Account, for Create a Workspace: for someone whose session is in none — with none
 * yet, with Invitations waiting, or choosing among theirs — who may create one instead.
 */
export async function requireAccountToCreateWorkspace(): Promise<IntroducedAccount> {
  const landing = await readLanding();
  if (
    landing.page !== 'createWorkspace' &&
    landing.page !== 'joinWorkspace' &&
    landing.page !== 'chooseWorkspace'
  ) {
    sendTo(landing, undefined);
  }
  return landing.account;
}

/**
 * The signed-in Account, for Choose a Workspace: for someone able to open more than one whose
 * session is in none — just signed in, or Deactivated in the one it was in.
 */
export async function requireAccountToChooseWorkspace(
  signedIn?: '1',
): Promise<IntroducedAccount> {
  const landing = await readLanding();
  if (landing.page !== 'chooseWorkspace') {
    sendTo(landing, signedIn);
  }
  return landing.account;
}

/** The Invitations to choose from, for someone in no Workspace who has any waiting. */
export async function requireInvitationsToJoin(): Promise<PendingInvitations> {
  const landing = await readLanding();
  if (landing.page !== 'joinWorkspace') {
    sendTo(landing, undefined);
  }
  return landing.invitations;
}
