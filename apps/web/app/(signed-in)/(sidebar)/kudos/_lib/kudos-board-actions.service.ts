'use server';

import { z } from 'zod';
import { readNextPageAsMember } from '@/app/(signed-in)/(sidebar)/_lib/read-next-page.service';
import { readKudosBoardPage } from './kudos-board.service';
import type { KudosBoardPage } from './kudos-board.type';
import { KudosSearchParams } from './kudos-search-params.schema';

const NextPage = KudosSearchParams.extend({
  cursor: z.string().min(1),
});

/**
 * The next page of the board, on the same terms as every other list beside it. The Workspace
 * comes from the session, so nothing the browser sends can name somebody else's. `null` means it
 * could not be read, which the board says with a way to try again.
 */
export async function readNextKudosBoardPage(
  input: unknown,
): Promise<KudosBoardPage | null> {
  const parsed = NextPage.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  return readNextPageAsMember((membership) =>
    readKudosBoardPage(membership, parsed.data.month, parsed.data.cursor),
  );
}
