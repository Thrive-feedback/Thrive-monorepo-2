import { ComposeAction } from '@/app/(signed-in)/(sidebar)/_components/compose-action';
import { readComposeContext } from '@/app/(signed-in)/(sidebar)/_lib/compose-context.service';
import { RECEIVED_HEADING_ID } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-side.constant';
import { RECEIVED_EMPTY } from '@/app/(signed-in)/(sidebar)/received/_lib/received-empty.constant';
import { CardsEmpty } from '@/components/organisms/cards-empty';
import type { ReceivedShow } from '@/lib/routes.constant';
import type { MemberAccount } from '@/lib/session/session.service';

export type ReceivedEmptyProps = {
  session: MemberAccount;
  /** The kind Received is narrowed to, or all of them. */
  show: ReceivedShow;
};

/**
 * Received with nothing in it, for the kind it is narrowed to, and the cards worth writing from here
 * (`RECEIVED_EMPTY`). It is the one place Received reads who a card can be for.
 */
export async function ReceivedEmpty({ session, show }: ReceivedEmptyProps) {
  const compose = await readComposeContext(session);
  const { choices, ...empty } = RECEIVED_EMPTY[show];

  return (
    <CardsEmpty {...empty}>
      {choices.map((choice) => (
        <ComposeAction
          key={choice}
          {...compose}
          choice={choice}
          returnFocusTo={RECEIVED_HEADING_ID}
        />
      ))}
    </CardsEmpty>
  );
}
