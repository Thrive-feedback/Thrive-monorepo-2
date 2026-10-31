'use server';

import { ApiError } from '@repo/api';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { BRAND_NEW_WAITING_SORTS, ROUTES } from '@/lib/routes.constant';
import { readCurrentMembership } from '@/lib/session/session.service';
import { readWaitingAsks, type WaitingAsksPage } from './waiting-asks.service';

const NextPage = z.object({
  sort: z.enum(BRAND_NEW_WAITING_SORTS),
  cursor: z.string().min(1),
});

/**
 * The next page of Waiting for me, for a list scrolling past the end of what it has, on the same
 * terms as Home's. The Workspace comes from the session, so nothing the browser sends can name
 * somebody else's. `null` means it could not be read, which the list says with a way to try again.
 */
export async function readNextWaitingAsks(
  input: unknown,
): Promise<WaitingAsksPage | null> {
  const parsed = NextPage.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  const membership = await readCurrentMembership();
  if (!membership) {
    redirect(ROUTES.signIn);
  }
  try {
    return await readWaitingAsks(
      membership,
      parsed.data.sort,
      parsed.data.cursor,
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}
