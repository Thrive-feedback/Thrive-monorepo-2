import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { readSession } from '@/lib/session/session.service';

/**
 * Lets a page under the UI showcase render only for someone on the API's list (ADR 0088). Every
 * showcase page calls it first, because a layout is not run on every request that renders a page.
 *
 * Signed out goes to sign in, as every signed-in page does; the proxy has already carried where they
 * were going for a visitor with no cookie at all. Signed in but not on the list, or an API that
 * cannot say, is not found — the address gives away nothing about what is behind it.
 */
export const requireUiShowcaseAccess = cache(async (): Promise<void> => {
  // Asked together: neither needs the other's answer, and a signed-out caller's access read is
  // simply refused by the API, which reads as not allowed.
  const [account, isAllowed] = await Promise.all([
    readSession(),
    readIsAllowed(),
  ]);
  if (!account) {
    redirect(ROUTES.signIn);
  }
  if (!isAllowed) {
    notFound();
  }
});

/** Whether the API puts this request's person on the list. Any API failure reads as no. */
async function readIsAllowed(): Promise<boolean> {
  try {
    const cookie = (await headers()).get('cookie') ?? undefined;
    return unwrap(
      await apiClient().GET('/v1/ui-showcase-access/mine', {
        params: { header: { cookie } },
        cache: 'no-store',
      }),
    ).isAllowed;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return false;
  }
}
