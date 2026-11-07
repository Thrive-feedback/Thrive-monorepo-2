'use server';

import type { PersonalItemsPage } from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import { readPageAfterCursor } from '@/app/(signed-in)/(sidebar)/_lib/read-next-page.service';
import { receivedShowOf } from '@/lib/routes.constant';
import { readReceivedItems } from './received-items.service';

/**
 * The next page of Received, for a list scrolling past the end of what it has. A server action
 * because the browser cannot reach the API. The Workspace and the reader come from the session, so
 * nothing the browser sends can name somebody else's. `show` is bound by the page that drew the
 * list, and comes back through the browser, so it is read again here.
 *
 * `null` means it could not be read, which the list says in a sentence with a way to try again.
 */
export async function readNextReceivedPage(
  show: unknown,
  input: unknown,
): Promise<PersonalItemsPage | null> {
  const narrowedTo = receivedShowOf(typeof show === 'string' ? show : null);
  return readPageAfterCursor(input, (membership, cursor) =>
    readReceivedItems(membership, narrowedTo, cursor),
  );
}
