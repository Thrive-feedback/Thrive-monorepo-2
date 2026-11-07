import { ComposeAction } from '@/app/(signed-in)/(sidebar)/_components/compose-action';
import { readComposeContext } from '@/app/(signed-in)/(sidebar)/_lib/compose-context.service';
import { readKudosBoardMonths } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board.service';
import { Skeleton } from '@/components/atoms/skeleton';
import type { MemberAccount } from '@/lib/session/session.service';

export type KudosBoardGiveProps = {
  session: MemberAccount;
};

/**
 * Give kudos, in the warm orange, beside Tidy up at the head of the board, so a Kudos can be pinned
 * up from where they hang. A board with none on it offers the same in its empty state, so this waits
 * for the first one. It stays after a send, so focus comes back to it. Who a card can be for, and how
 * many Kudos there are, are read once for the page by the sidebar and the board.
 */
export async function KudosBoardGive({ session }: KudosBoardGiveProps) {
  const [compose, { total }] = await Promise.all([
    readComposeContext(session),
    readKudosBoardMonths(session.membership),
  ]);
  if (total === 0) {
    return null;
  }

  return <ComposeAction {...compose} choice="kudos" />;
}

/**
 * `KudosBoardGive` still reading: a button's room, so nothing shifts when it comes on a board with
 * Kudos. On a board with none the room closes once read, which is the rarer of the two.
 */
export function KudosBoardGiveSkeleton() {
  return <Skeleton className="h-10 w-30 rounded-button" />;
}
