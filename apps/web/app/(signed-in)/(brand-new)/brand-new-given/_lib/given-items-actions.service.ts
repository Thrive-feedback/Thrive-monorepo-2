'use server';

import type { PersonalItemsPage } from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { readPageAfterCursor } from '@/app/(signed-in)/(brand-new)/_lib/read-next-page.service';
import { readGivenItems } from './given-items.service';

/**
 * The next page of Given, for a list scrolling past the end of what it has. A server action because
 * the browser cannot reach the API. The Workspace and the reader come from the session, so nothing
 * the browser sends can name somebody else's.
 *
 * `null` means it could not be read, which the list says in a sentence with a way to try again.
 */
export async function readNextGivenPage(
  input: unknown,
): Promise<PersonalItemsPage | null> {
  return readPageAfterCursor(input, readGivenItems);
}
