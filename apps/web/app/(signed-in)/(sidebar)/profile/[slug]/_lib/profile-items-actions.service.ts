'use server';

import { z } from 'zod';
import { readNextPageAsMember } from '@/app/(signed-in)/(sidebar)/_lib/read-next-page.service';
import { PROFILE_SHOWS } from '@/lib/routes.constant';
import type { ProfileItemsPage } from './profile-item.type';
import { readProfileItems } from './profile-items.service';

const NextProfilePageInput = z.object({
  cursor: z.string().min(1),
  accountId: z.uuid(),
  show: z.enum(PROFILE_SHOWS),
});

/**
 * The next page of one of a Profile's lists, for a list scrolling past the end of what it has. A
 * server action because the browser cannot reach the API. The Workspace and the reader come from
 * the session; whose Profile it is may come from the browser, because a Profile holds only what its
 * reader already reads on Home.
 *
 * `null` means it could not be read, which the list says in a sentence with a way to try again.
 */
export async function readNextProfilePage(
  input: unknown,
): Promise<ProfileItemsPage | null> {
  const parsed = NextProfilePageInput.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  const { cursor, accountId, show } = parsed.data;
  return readNextPageAsMember((membership) =>
    readProfileItems(membership, accountId, show, cursor),
  );
}
