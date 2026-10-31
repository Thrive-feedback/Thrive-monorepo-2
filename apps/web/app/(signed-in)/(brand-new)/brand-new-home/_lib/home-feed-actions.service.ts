'use server';

import { ApiError } from '@repo/api';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { HomeFeedPage } from '@/lib/feedback/home-feed-item.type';
import { BRAND_NEW_HOME_SHOWS, ROUTES } from '@/lib/routes.constant';
import { readCurrentMembership } from '@/lib/session/session.service';
import { readHomeFeed } from './home-feed.service';

const NextPage = z.object({
  show: z.enum(BRAND_NEW_HOME_SHOWS),
  cursor: z.string().min(1),
});

/**
 * The next page of Home, for a list scrolling past the end of what it has. A server action because
 * the browser cannot reach the API, as the bell reads through one (design `0022` §4.3). The
 * Workspace comes from the session, so nothing the browser sends can name somebody else's.
 *
 * `null` means it could not be read, which the list says in a sentence with a way to try again.
 */
export async function readNextHomeFeedPage(
  input: unknown,
): Promise<HomeFeedPage | null> {
  const parsed = NextPage.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  const membership = await readCurrentMembership();
  if (!membership) {
    redirect(ROUTES.signIn);
  }
  try {
    return await readHomeFeed(membership, parsed.data.show, parsed.data.cursor);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}
