import Link from 'next/link';
import { ComposeAction } from '@/app/(signed-in)/(sidebar)/_components/compose-action';
import { readComposeContext } from '@/app/(signed-in)/(sidebar)/_lib/compose-context.service';
import { KUDOS_BOARD_HEADING_ID } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board.constant';
import { kudosMonthName } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board-place.util';
import { Button } from '@/components/atoms/button';
import { CardsEmpty } from '@/components/organisms/cards-empty';
import { ROUTES } from '@/lib/routes.constant';
import type { MemberAccount } from '@/lib/session/session.service';

export type KudosBoardEmptyProps = {
  session: MemberAccount;
  /** The month asked for, or nothing for every month. */
  month: string | undefined;
};

/**
 * A board with nothing on it, drawn as an empty Received or Given is: one place left for a Kudos card,
 * and the one thing to do. A month with none sends the reader back to every month; a board with none
 * at all offers to give the first, and is the one place it reads who a Kudos can be for.
 */
export async function KudosBoardEmpty({
  session,
  month,
}: KudosBoardEmptyProps) {
  if (month) {
    return (
      <CardsEmpty
        art="secondary"
        title={`Nothing here from ${kudosMonthName(month)}`}
      >
        <Button asChild>
          <Link href={ROUTES.kudos}>See every month</Link>
        </Button>
      </CardsEmpty>
    );
  }

  const compose = await readComposeContext(session);
  return (
    <CardsEmpty
      art="secondary"
      title="Nothing on the board yet"
      description="The first Kudos anyone gives lands here."
    >
      <ComposeAction
        {...compose}
        choice="kudos"
        returnFocusTo={KUDOS_BOARD_HEADING_ID}
      />
    </CardsEmpty>
  );
}
