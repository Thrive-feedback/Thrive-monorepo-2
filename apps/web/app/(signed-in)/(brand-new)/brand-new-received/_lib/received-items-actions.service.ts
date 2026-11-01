'use server';

import { z } from 'zod';
import { readNextPageAsMember } from '@/app/(signed-in)/(brand-new)/_lib/read-next-page.service';
import type { ReceivedPage } from './received-item.type';
import { readReceivedItems } from './received-items.service';

const NextPage = z.object({ cursor: z.string().min(1) });

/**
 * The next page of Received, for a list scrolling past the end of what it has. A server action
 * because the browser cannot reach the API. The Workspace and the reader come from the session, so
 * nothing the browser sends can name somebody else's.
 *
 * `null` means it could not be read, which the list says in a sentence with a way to try again.
 */
export async function readNextReceivedPage(
  input: unknown,
): Promise<ReceivedPage | null> {
  const parsed = NextPage.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  return readNextPageAsMember((membership) =>
    readReceivedItems(membership, parsed.data.cursor),
  );
}
